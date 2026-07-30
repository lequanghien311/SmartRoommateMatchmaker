const express = require('express');
const { pool } = require('../../database/connection');
const { messaging, cache } = require('../../shared/providers');
const { storage } = require('../media/media.routes');
const { realtime } = require('../chat/chat.routes');
const HealthService = require('./health.service');
const HealthController = require('./health.controller');
const controller = new HealthController(new HealthService(pool, storage, messaging, realtime, cache));
const router = express.Router();
router.get('/', controller.basic);
router.get('/database', controller.database);
router.get('/storage', controller.storage);
router.get('/messaging', controller.messaging);
router.get('/realtime', controller.realtime);
router.get('/cache', controller.cache);
module.exports = router;

