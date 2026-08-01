const express = require('express');
const multer = require('multer');
const { pool } = require('../../database/connection');
const env = require('../../config/env');
const { authenticate, authorize } = require('../../shared/middlewares/auth');
const AppError = require('../../shared/errors/AppError');
const LocalStorageProvider = require('../../shared/providers/storage/LocalStorageProvider');
const AzureBlobStorageProvider = require('../../shared/providers/storage/AzureBlobStorageProvider');
const AzureVisionProvider = require('../../shared/providers/cloud/AzureVisionProvider');
const MediaRepository = require('./media.repository');
const MediaService = require('./media.service');
const MediaController = require('./media.controller');

const providerName = (env.storageProvider || '').trim().toLowerCase();
const storage = ['azure', 'azure-blob'].includes(providerName)
  ? new AzureBlobStorageProvider(process.env.AZURE_STORAGE_CONNECTION_STRING, process.env.AZURE_STORAGE_CONTAINER)
  : new LocalStorageProvider(env.uploadDir);
const vision = new AzureVisionProvider();
const controller = new MediaController(new MediaService(new MediaRepository(pool), storage, vision));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new AppError('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP', 422));
    }
    return callback(null, true);
  },
});
const router = express.Router();
router.use(authenticate, authorize('landlord', 'admin'));
router.post('/rooms/:roomId/images', upload.array('images', 10), controller.upload);
router.get('/images/:imageId/vision', controller.vision);
router.delete('/images/:imageId', controller.remove);
router.patch('/rooms/:roomId/images/:imageId/cover', controller.cover);
router.patch('/rooms/:roomId/images/reorder', controller.reorder);

module.exports = { router, storage };
