const AppError = require('../../shared/errors/AppError');
const { getPagination } = require('../../shared/utils/pagination');
class NotificationsService {
  constructor(repository) { this.repository = repository; }
  create(...args) { return this.repository.create(...args); }
  list(userId, query) { const { limit, offset } = getPagination(query); return this.repository.list(userId, limit, offset); }
  unread(userId) { return this.repository.unread(userId); }
  async read(userId, id) { const item = await this.repository.read(userId, id); if (!item) throw new AppError('Không tìm thấy thông báo', 404); return item; }
  readAll(userId) { return this.repository.readAll(userId); }
}
module.exports = NotificationsService;

