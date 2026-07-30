const express = require('express');
const rateLimit = require('express-rate-limit');
const { pool } = require('../../database/connection');
const { messaging } = require('../../shared/providers');
const { authenticate } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const AuthRepository = require('./auth.repository');
const AuthService = require('./auth.service');
const AuthController = require('./auth.controller');
const validators = require('./auth.validator');

const router = express.Router();
const controller = new AuthController(new AuthService(new AuthRepository(pool), messaging));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau', errors: [] },
});

router.post('/register', validators.register, validate, controller.register);
router.post('/login', loginLimiter, validators.login, validate, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);
router.put('/change-password', authenticate, validators.changePassword, validate, controller.changePassword);

module.exports = router;

