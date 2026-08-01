const AppError = require('../../shared/errors/AppError');

class MediaService {
  constructor(repository, storage, vision = null) {
    this.repository = repository;
    this.storage = storage;
    this.vision = vision;
  }

  async upload(roomId, user, files) {
    if (!(await this.repository.roomOwnedBy(roomId, user))) throw new AppError('Bạn không có quyền sửa phòng này', 403);
    const count = await this.repository.count(roomId);
    if (count + files.length > 10) throw new AppError('Mỗi phòng chỉ được tối đa 10 ảnh', 422);
    const created = [];
    for (let index = 0; index < files.length; index += 1) {
      const stored = await this.storage.save(files[index], `rooms/${roomId}`);
      try {
        const image = await this.repository.create(roomId, files[index], stored, count + index);
        const analysis = this.vision
          ? await this.vision.analyzeImageBuffer(files[index].buffer, files[index].mimetype, stored.key)
          : null;
        created.push({
          ...image,
          storageProvider: this.storageProvider(image),
          storageFallbackUsed: !image.url.includes('.blob.core.windows.net/'),
          vision: analysis,
        });
      } catch (error) {
        await this.storage.delete(stored.key).catch(() => {});
        throw error;
      }
    }
    return created;
  }

  async analyze(imageId, user) {
    const image = await this.repository.find(imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    if (!(await this.repository.roomOwnedBy(image.room_id, user))) {
      throw new AppError('Bạn không có quyền phân tích ảnh này', 403);
    }
    if (!this.vision) throw new AppError('Azure AI Vision chưa được cấu hình', 503);
    const buffer = await this.storage.readBuffer(image.storage_key);
    const result = await this.vision.analyzeImageBuffer(buffer, image.mime_type, image.storage_key);
    return {
      imageId: image.id,
      imageUrl: image.url,
      storageProvider: this.storageProvider(image),
      storageFallbackUsed: !image.url.includes('.blob.core.windows.net/'),
      ...result,
    };
  }

  async content(imageId) {
    const image = await this.repository.find(imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    return {
      buffer: await this.storage.readBuffer(image.storage_key),
      mimeType: image.mime_type,
      provider: this.storageProvider(image),
    };
  }

  storageProvider(image) {
    return image.url.includes('.blob.core.windows.net/') ? 'azure-blob' : 'local-storage';
  }

  async remove(imageId, user) {
    const image = await this.repository.find(imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    if (!(await this.repository.roomOwnedBy(image.room_id, user))) throw new AppError('Bạn không có quyền xóa ảnh', 403);
    await this.repository.remove(imageId);
    await this.storage.delete(image.storage_key).catch(() => {});
  }

  async cover(roomId, imageId, user) {
    if (!(await this.repository.roomOwnedBy(roomId, user))) throw new AppError('Bạn không có quyền sửa phòng này', 403);
    const image = await this.repository.cover(roomId, imageId);
    if (!image) throw new AppError('Không tìm thấy ảnh', 404);
    return image;
  }

  async reorder(roomId, imageIds, user) {
    if (!(await this.repository.roomOwnedBy(roomId, user))) throw new AppError('Bạn không có quyền sửa phòng này', 403);
    await this.repository.reorder(roomId, imageIds);
  }
}

module.exports = MediaService;
