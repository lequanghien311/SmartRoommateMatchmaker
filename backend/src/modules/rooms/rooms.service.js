const sanitizeHtml = require('sanitize-html');
const AppError = require('../../shared/errors/AppError');
const { transaction } = require('../../database/connection');
const { getPagination, pageMeta } = require('../../shared/utils/pagination');

class RoomsService {
  constructor(repository, messaging, cache, logger) {
    this.repository = repository;
    this.messaging = messaging;
    this.cache = cache;
    this.logger = logger;
  }

  async search(query) {
    const pagination = getPagination(query);
    const result = await this.repository.search(query, pagination.limit, pagination.offset);
    return { data: result.rows, meta: pageMeta(result.total, pagination.page, pagination.limit) };
  }

  async detail(id) {
    const room = await this.repository.findById(id);
    if (!room) throw new AppError('Không tìm thấy phòng', 404);
    this.repository.incrementView(id).catch(() => {});
    return room;
  }

  async manage(id, user) {
    const room = await this.repository.findById(id, true);
    if (!room || (user.role !== 'admin' && room.landlord_id !== user.id)) {
      throw new AppError('Không tìm thấy phòng hoặc bạn không phải chủ tin', 404);
    }
    return room;
  }

  clean(input) {
    const clean = { ...input };
    for (const field of ['title', 'description', 'address']) {
      if (clean[field] !== undefined) clean[field] = sanitizeHtml(String(clean[field]), { allowedTags: [] }).trim();
    }
    return clean;
  }

  async create(userId, input, correlationId) {
    const room = await transaction((client) => this.repository.create(client, userId, this.clean(input)));
    try {
      const event = this.messaging.createEvent?.('RoomCreated', 'rooms', { roomId: room.id, userId }, correlationId);
      if (event) await this.messaging.publish(event);
    } catch (error) {
      this.logger.error('room_created_publish_failed', { roomId: room.id, message: error.message });
    }
    await this.cache.delete('rooms:');
    return room;
  }

  async update(id, user, input) {
    const room = await this.repository.update(id, user, this.clean(input));
    if (!room) throw new AppError('Không tìm thấy phòng hoặc bạn không phải chủ tin', 404);
    await this.cache.delete('rooms:');
    return room;
  }

  async transition(id, user, status, reason, correlationId) {
    const allowed = { landlord: ['pending', 'hidden', 'rented'], admin: ['active', 'rejected', 'hidden'] };
    if (!allowed[user.role]?.includes(status)) throw new AppError('Chuyển trạng thái không hợp lệ', 400);
    if (status === 'pending' && (await this.repository.countImages(id)) < 1) {
      throw new AppError('Phải có ít nhất một ảnh trước khi gửi duyệt', 422, [
        { field: 'images', message: 'Phải có ít nhất một ảnh' },
      ]);
    }
    const room = await this.repository.transition(id, user, status, reason);
    if (!room) throw new AppError('Không tìm thấy phòng hoặc bạn không có quyền', 404);
    const eventType = { pending: 'RoomSubmitted', active: 'RoomApproved', rejected: 'RoomRejected' }[status];
    if (eventType) {
      const event = this.messaging.createEvent?.(eventType, 'rooms', { roomId: id }, correlationId);
      if (event) await this.messaging.publish(event);
    }
    await this.cache.delete('rooms:');
    return room;
  }

  async mine(userId, query) {
    const pagination = getPagination(query);
    return this.repository.mine(userId, pagination.limit, pagination.offset);
  }

  async remove(id, user) {
    if (!(await this.repository.softDelete(id, user))) throw new AppError('Không tìm thấy phòng', 404);
    await this.cache.delete('rooms:');
  }
}

module.exports = RoomsService;
