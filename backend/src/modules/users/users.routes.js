const express = require('express');
const { pool } = require('../../database/connection');
const { authenticate } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const UsersRepository = require('./users.repository');
const UsersService = require('./users.service');
const UsersController = require('./users.controller');
const validators = require('./users.validator');

const router = express.Router();
const controller = new UsersController(new UsersService(new UsersRepository(pool)));
router.get('/me', authenticate, controller.me);
router.put('/me', authenticate, validators.update, validate, controller.update);
router.get('/me/activity', authenticate, controller.activity);
router.get('/:id', validators.userId, validate, controller.publicProfile);

module.exports = router;

