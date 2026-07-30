const sanitizeHtml = require('sanitize-html');
const AppError = require('../../shared/errors/AppError');

class RoommateProfilesService {
  constructor(repository) {
    this.repository = repository;
  }

  async get(userId) {
    const profile = await this.repository.getByUser(userId);
    if (!profile) throw new AppError('Chưa có hồ sơ tìm người ở ghép', 404);
    return profile;
  }

  upsert(userId, input) {
    return this.repository.upsert(userId, {
      ...input,
      school: input.school ? sanitizeHtml(input.school, { allowedTags: [] }) : null,
      habits: input.habits ? sanitizeHtml(input.habits, { allowedTags: [] }) : null,
    });
  }
}

module.exports = RoommateProfilesService;

