const AppError = require('../../shared/errors/AppError');
const sanitizeHtml = require('sanitize-html');

class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  async getPublic(id) {
    const user = await this.repository.getPublic(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async getMe(id) {
    const user = await this.repository.getPrivate(id);
    if (!user) throw new AppError('Không tìm thấy người dùng', 404);
    return user;
  }

  async update(id, input) {
    const clean = {
      ...input,
      fullName: input.fullName ? sanitizeHtml(input.fullName, { allowedTags: [] }) : undefined,
      bio: input.bio ? sanitizeHtml(input.bio, { allowedTags: [] }) : undefined,
      school: input.school ? sanitizeHtml(input.school, { allowedTags: [] }) : undefined,
    };
    return this.repository.update(id, clean);
  }

  activity(id, limit = 20, offset = 0) {
    return this.repository.activity(id, limit, offset);
  }
}

module.exports = UsersService;

