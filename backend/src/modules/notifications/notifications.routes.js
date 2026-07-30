const express = require('express');
const { pool } = require('../../database/connection');
const { authenticate } = require('../../shared/middlewares/auth');
const Repository = require('./notifications.repository');
const Service = require('./notifications.service');
const Controller = require('./notifications.controller');
const repository = new Repository(pool);
const service = new Service(repository);
const controller = new Controller(service);
const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.get('/unread-count', controller.unread);
router.patch('/read-all', controller.readAll);
router.patch('/:id/read', controller.read);
module.exports = { router, service };

