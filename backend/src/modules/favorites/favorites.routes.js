const express = require('express');
const { pool } = require('../../database/connection');
const { messaging } = require('../../shared/providers');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const FavoritesRepository = require('./favorites.repository');
const FavoritesService = require('./favorites.service');
const FavoritesController = require('./favorites.controller');

const router = express.Router();
const controller = new FavoritesController(new FavoritesService(new FavoritesRepository(pool), messaging));
router.use(authenticate, authorize('tenant'));
router.get('/', controller.list);
router.post('/:roomId', controller.add);
router.delete('/:roomId', controller.remove);
module.exports = router;

