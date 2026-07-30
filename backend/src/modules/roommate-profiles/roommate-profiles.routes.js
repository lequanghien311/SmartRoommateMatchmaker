const express = require('express');
const { pool } = require('../../database/connection');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const Repository = require('./roommate-profiles.repository');
const Service = require('./roommate-profiles.service');
const Controller = require('./roommate-profiles.controller');
const validator = require('./roommate-profiles.validator');

const router = express.Router();
const controller = new Controller(new Service(new Repository(pool)));
router.use(authenticate, authorize('tenant'));
router.get('/', controller.get);
router.put('/', validator, validate, controller.upsert);
module.exports = router;

