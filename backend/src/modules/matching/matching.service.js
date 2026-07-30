const AppError = require('../../shared/errors/AppError');

class MatchingService {
  constructor(repository, provider, messaging) {
    this.repository = repository;
    this.provider = provider;
    this.messaging = messaging;
  }

  async calculate(userId, correlationId) {
    const profile = await this.repository.profile(userId);
    if (!profile) throw new AppError('Hãy tạo hồ sơ ở ghép trước', 404);
    if (!profile.is_looking) throw new AppError('Hồ sơ đang tạm dừng tìm kiếm', 400);
    const candidates = await this.repository.candidates(userId);
    const results = [];
    for (const candidate of candidates) {
      const result = await this.provider.calculate(profile, candidate);
      await this.repository.save(userId, candidate.user_id, result);
      results.push({ candidate: { id: candidate.user_id, fullName: candidate.full_name, avatarUrl: candidate.avatar_url, school: candidate.school }, ...result });
    }
    results.sort((left, right) => right.totalScore - left.totalScore);
    const event = this.messaging.createEvent?.('MatchCalculated', 'matching', { userId, count: results.length }, correlationId);
    if (event) await this.messaging.publish(event);
    return results;
  }

  async detail(userId, candidateId) {
    const profile = await this.repository.profile(userId);
    const candidate = await this.repository.profile(candidateId);
    if (!profile || !candidate || candidate.status !== 'active' || !candidate.is_looking) {
      throw new AppError('Không tìm thấy ứng viên phù hợp', 404);
    }
    return { candidate: { id: candidate.user_id, fullName: candidate.full_name, avatarUrl: candidate.avatar_url }, ...(await this.provider.calculate(profile, candidate)) };
  }
}

module.exports = MatchingService;

