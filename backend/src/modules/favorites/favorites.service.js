const AppError = require('../../shared/errors/AppError');
const { getPagination } = require('../../shared/utils/pagination');

class FavoritesService {
  constructor(repository, messaging) {
    this.repository = repository;
    this.messaging = messaging;
  }

  async add(userId, roomId, correlationId) {
    const favorite = await this.repository.add(userId, roomId);
    if (!favorite) throw new AppError('Phòng đã có trong danh sách yêu thích', 409);
    const event = this.messaging.createEvent?.('RoomFavorited', 'favorites', { roomId, userId }, correlationId);
    if (event) await this.messaging.publish(event);
    return favorite;
  }

  async remove(userId, roomId) {
    if (!(await this.repository.remove(userId, roomId))) throw new AppError('Không tìm thấy mục yêu thích', 404);
  }

  list(userId, query) {
    const { limit, offset } = getPagination(query);
    return this.repository.list(userId, limit, offset);
  }
}

module.exports = FavoritesService;

