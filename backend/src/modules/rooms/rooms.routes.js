const express = require('express');
const { pool } = require('../../database/connection');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const validate = require('../../shared/middlewares/validate');
const { messaging, cache, logger } = require('../../shared/providers');
const RoomsRepository = require('./rooms.repository');
const RoomsService = require('./rooms.service');
const RoomsController = require('./rooms.controller');
const RoomIntelligenceService = require('./room-intelligence.service');
const RoomIntelligenceController = require('./room-intelligence.controller');
const AzureContentSafetyProvider = require('../../shared/providers/cloud/AzureContentSafetyProvider');
const AzureTranslatorProvider = require('../../shared/providers/cloud/AzureTranslatorProvider');
const AzureSpeechProvider = require('../../shared/providers/cloud/AzureSpeechProvider');
const AzureMapsProvider = require('../../shared/providers/cloud/AzureMapsProvider');
const AzureLanguageProvider = require('../../shared/providers/cloud/AzureLanguageProvider');
const validators = require('./rooms.validator');

const router = express.Router();
const repository = new RoomsRepository(pool);
const contentSafety = new AzureContentSafetyProvider();
const controller = new RoomsController(new RoomsService(repository, messaging, cache, logger, contentSafety));
const intelligenceController = new RoomIntelligenceController(new RoomIntelligenceService(
  repository,
  new AzureTranslatorProvider(),
  new AzureSpeechProvider(),
  new AzureMapsProvider(),
  new AzureLanguageProvider(),
));
router.get('/', validators.search, validate, controller.search);
router.get('/mine', authenticate, authorize('landlord'), controller.mine);
router.post('/', authenticate, authorize('landlord'), validators.create, validate, controller.create);
router.post('/geocode', authenticate, authorize('landlord', 'admin'), validators.geocode, validate, intelligenceController.geocode);
router.get('/:id/translation', validators.id, validate, intelligenceController.translate);
router.get('/:id/language', validators.id, validate, intelligenceController.language);
router.get('/:id/speech', validators.id, validate, intelligenceController.speech);
router.get('/:id/manage', authenticate, authorize('landlord', 'admin'), validators.id, validate, controller.manage);
router.get('/:id', validators.id, validate, controller.detail);
router.put('/:id', authenticate, authorize('landlord', 'admin'), validators.id, validators.update, validate, controller.update);
router.patch('/:id/status', authenticate, authorize('landlord', 'admin'), validators.id, validators.transition, validate, controller.transition);
router.delete('/:id', authenticate, authorize('landlord', 'admin'), validators.id, validate, controller.remove);

module.exports = router;
