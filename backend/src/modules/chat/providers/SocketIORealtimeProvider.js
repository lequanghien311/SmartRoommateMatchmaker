const { Server } = require('socket.io');
const RealtimeProvider = require('./RealtimeProvider');

class SocketIORealtimeProvider extends RealtimeProvider {
  constructor(corsOrigin) {
    super();
    this.corsOrigin = corsOrigin;
    this.io = null;
    this.online = new Map();
  }

  initialize(server, authenticateSocket, handlers) {
    this.io = new Server(server, { cors: { origin: this.corsOrigin, credentials: true } });
    this.io.use(authenticateSocket);
    this.io.on('connection', (socket) => {
      const userId = socket.user.id;
      socket.join(`user:${userId}`);
      this.online.set(userId, (this.online.get(userId) || 0) + 1);
      this.io.emit('presence', { userId, online: true });
      socket.on('conversation:join', async (conversationId, callback = () => {}) => {
        try {
          await handlers.join(userId, conversationId);
          socket.join(`conversation:${conversationId}`);
          callback({ success: true });
        } catch (error) {
          callback({ success: false, message: error.message });
        }
      });
      socket.on('message:send', async (input, callback = () => {}) => {
        try {
          callback({ success: true, data: await handlers.message(userId, input) });
        } catch (error) {
          callback({ success: false, message: error.message });
        }
      });
      socket.on('typing', async ({ conversationId, typing }) => {
        if (await handlers.canAccess(userId, conversationId)) {
          socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId, typing: Boolean(typing) });
        }
      });
      socket.on('disconnect', () => {
        const count = Math.max(0, (this.online.get(userId) || 1) - 1);
        if (count) this.online.set(userId, count);
        else {
          this.online.delete(userId);
          this.io.emit('presence', { userId, online: false });
        }
      });
    });
  }

  async sendToConversation(conversationId, event, data) {
    this.io?.to(`conversation:${conversationId}`).emit(event, data);
  }

  async sendToUser(userId, event, data) {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  async health() {
    return { status: this.io ? 'healthy' : 'starting', provider: 'socketio', onlineUsers: this.online.size };
  }
}
module.exports = SocketIORealtimeProvider;

