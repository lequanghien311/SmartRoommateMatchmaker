const sanitizeHtml = require('sanitize-html');
const AppError = require('../../shared/errors/AppError');
const { getPagination } = require('../../shared/utils/pagination');
class ReportsService {
  constructor(repository, messaging) { this.repository = repository; this.messaging = messaging; }
  async create(userId, input, correlationId) {
    if (await this.repository.duplicate(userId, input.roomId)) throw new AppError('Bạn vừa báo cáo phòng này, vui lòng chờ quản trị viên xử lý', 429);
    const report = await this.repository.create(userId, { ...input, description: sanitizeHtml(input.description || '', { allowedTags: [] }) });
    if (!report) throw new AppError('Không tìm thấy phòng', 404);
    const event = this.messaging.createEvent?.('ReportCreated', 'reports', { reportId: report.id, roomId: report.room_id }, correlationId);
    if (event) await this.messaging.publish(event);
    return report;
  }
  list(userId, query) { const { limit, offset } = getPagination(query); return this.repository.list(userId, limit, offset); }
}
module.exports = ReportsService;

