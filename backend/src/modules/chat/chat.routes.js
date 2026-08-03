const express = require('express');
const jwt = require('jsonwebtoken');
const { pool, transaction } = require('../../database/connection');
const env = require('../../config/env');
const { messaging } = require('../../shared/providers');
const { authenticate } = require('../../shared/middlewares/auth');
const AppError = require('../../shared/errors/AppError');
const SocketIO = require('./providers/SocketIORealtimeProvider');
const AzureWebPubSub = require('./providers/AzureWebPubSubProvider');
const Repository = require('./chat.repository');
const Service = require('./chat.service');
const Controller = require('./chat.controller');
const { service: notifications } = require('../notifications/notifications.routes');

const DEFAULT_WEB_PUBSUB_HUB = 'smart_roommate';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const realtime = env.realtimeProvider === 'azure-web-pubsub'
  ? new AzureWebPubSub(
      process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING,
      process.env.AZURE_WEB_PUBSUB_HUB || DEFAULT_WEB_PUBSUB_HUB,
    )
  : new SocketIO(env.corsOrigin);
const repository = new Repository(pool, transaction);
const service = new Service(repository, realtime, messaging, notifications);
const controller = new Controller(service);
const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.get('/:conversationId/pubsub-token', async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!UUID_PATTERN.test(conversationId)) {
      throw new AppError('Mã cuộc trò chuyện không hợp lệ', 400);
    }
    if (!(await repository.canAccess(req.user.id, conversationId))) {
      throw new AppError('Bạn không có quyền truy cập cuộc trò chuyện này', 403);
    }
    const cs = process.env.AZURE_WEB_PUBSUB_CONNECTION_STRING;
    const hub = process.env.AZURE_WEB_PUBSUB_HUB || DEFAULT_WEB_PUBSUB_HUB;
    if (!cs) return res.status(400).json({ success: false, message: 'Thiếu AZURE_WEB_PUBSUB_CONNECTION_STRING' });
    const pubsub = new AzureWebPubSub(cs, hub);
    const token = await pubsub.getClientAccessToken(req.user.id, conversationId);
    res.json({
      success: true,
      data: {
        url: token.url,
        hub,
        group: `conversation:${conversationId}`,
        expiresInMinutes: 10,
      },
    });
  } catch (err) {
    next(err);
  }
});
router.post('/', controller.create);
router.get('/:id/messages', controller.messages);
router.post('/:id/messages', controller.send);
router.patch('/:id/read', controller.read);
router.delete('/messages/:messageId', controller.remove);

function initializeRealtime(server) {
  realtime.initialize(
    server,
    async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        const payload = jwt.verify(token, env.jwtSecret);
        const result = await pool.query("SELECT id,role,status FROM users WHERE id=$1 AND deleted_at IS NULL", [payload.sub]);
        if (!result.rowCount || result.rows[0].status !== 'active') throw new Error();
        socket.user = result.rows[0];
        next();
      } catch (_error) {
        next(new AppError('Socket chưa được xác thực', 401));
      }
    },
    {
      join: async (userId, conversationId) => {
        if (!(await repository.canAccess(userId, conversationId))) throw new AppError('Không có quyền truy cập', 403);
      },
      canAccess: (userId, conversationId) => repository.canAccess(userId, conversationId),
      message: (userId, input) => service.send(userId, input),
    },
  );
}

module.exports = { router, realtime, initializeRealtime };

