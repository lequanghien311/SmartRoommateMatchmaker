const express = require('express');
const { pool } = require('../../database/connection');
const { messaging } = require('../../shared/providers');
const { authenticate } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const Repository = require('./reports.repository');
const Service = require('./reports.service');
const Controller = require('./reports.controller');
const validator = require('./reports.validator');
const controller = new Controller(new Service(new Repository(pool), messaging));
const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.post('/', validator, validate, controller.create);
module.exports = router;

