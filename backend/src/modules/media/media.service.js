const AppError = require('../../shared/errors/AppError');

class MediaService {
  constructor(repository, storage) {
    this.repository = repository;
    this.storage = storage;
  }

  async upload(roomId, user, files) {
    if (!(await this.repository.roomOwnedBy(roomId, user))) throw new AppError('Bạn không có quyền sửa phòng này', 403);
    const count = await this.repository.count(roomId);
    if (count + files.length > 10) throw new AppError('Mỗi phòng chỉ được tối đa 10 ảnh', 422);
    const created = [];
    for (let index = 0; index < files.length; index += 1) {
      const stored = await this.storage.save(files[index], `rooms/${roomId}`);
      try {
        created.push(await this.repository.create(roomId, files[index], stored, count + index));
      } catch (error) {
        await this.storage.delete(stored.key).catch(() => {});
        throw error;
      }
    }
    return created;
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

