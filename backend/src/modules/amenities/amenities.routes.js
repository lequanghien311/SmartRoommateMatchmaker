const express = require('express');
const { pool } = require('../../database/connection');
const { cache } = require('../../shared/providers');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const AmenitiesRepository = require('./amenities.repository');
const AmenitiesService = require('./amenities.service');
const AmenitiesController = require('./amenities.controller');

const router = express.Router();
const controller = new AmenitiesController(new AmenitiesService(new AmenitiesRepository(pool), cache));
router.get('/', controller.list);
router.post('/', authenticate, authorize('admin'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
module.exports = router;

