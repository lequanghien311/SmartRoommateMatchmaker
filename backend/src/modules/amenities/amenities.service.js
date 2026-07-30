const AppError = require('../../shared/errors/AppError');

class AmenitiesService {
  constructor(repository, cache) {
    this.repository = repository;
    this.cache = cache;
  }

  async list() {
    const cached = await this.cache.get('amenities:active');
    if (cached) return cached;
    const items = await this.repository.list();
    await this.cache.set('amenities:active', items, 600);
    return items;
  }

  async create(input) {
    const result = await this.repository.create(input);
    await this.cache.delete('amenities:');
    return result;
  }

  async update(id, input) {
    const result = await this.repository.update(id, input);
    if (!result) throw new AppError('Không tìm thấy tiện ích', 404);
    await this.cache.delete('amenities:');
    return result;
  }
}

module.exports = AmenitiesService;

