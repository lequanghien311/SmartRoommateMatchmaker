const { BlobServiceClient } = require('@azure/storage-blob');
const { randomUUID } = require('crypto');
const StorageProvider = require('./StorageProvider');

class AzureBlobStorageProvider extends StorageProvider {
  constructor(connectionString, containerName) {
    super();
    if (!connectionString || !containerName) throw new Error('Thiếu cấu hình Azure Blob Storage');
    this.container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(containerName);
  }

  async save(file, folder = 'rooms') {
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.mimetype];
    const key = `${folder}/${randomUUID()}.${extension}`;
    const blob = this.container.getBlockBlobClient(key);
    await blob.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
      metadata: { originalName: encodeURIComponent(file.originalname) },
    });
    return { key, url: blob.url };
  }

  async delete(key) {
    await this.container.deleteBlob(key, { deleteSnapshots: 'include' });
  }

  async health() {
    await this.container.getProperties();
    return { status: 'healthy', provider: 'azure-blob' };
  }
}

module.exports = AzureBlobStorageProvider;

