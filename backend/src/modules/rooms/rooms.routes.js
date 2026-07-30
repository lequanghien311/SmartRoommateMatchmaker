const express = require('express');
const { pool } = require('../../database/connection');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const { messaging, cache, logger } = require('../../shared/providers');
const RoomsRepository = require('./rooms.repository');
const RoomsService = require('./rooms.service');
const RoomsController = require('./rooms.controller');
const validators = require('./rooms.validator');

const router = express.Router();
const controller = new RoomsController(new RoomsService(new RoomsRepository(pool), messaging, cache, logger));
router.get('/', validators.search, validate, controller.search);
router.get('/mine', authenticate, authorize('landlord'), controller.mine);
router.post('/', authenticate, authorize('landlord'), validators.create, validate, controller.create);
router.get('/:id', validators.id, validate, controller.detail);
router.put('/:id', authenticate, authorize('landlord', 'admin'), validators.id, validators.update, validate, controller.update);
router.patch('/:id/status', authenticate, authorize('landlord', 'admin'), validators.id, validators.transition, validate, controller.transition);
router.delete('/:id', authenticate, authorize('landlord', 'admin'), validators.id, validate, controller.remove);

module.exports = router;

