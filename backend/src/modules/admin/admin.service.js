const AppError = require('../../shared/errors/AppError');
const { getPagination } = require('../../shared/utils/pagination');
class AdminService {
  constructor(repository, messaging, notifications) { this.repository = repository; this.messaging = messaging; this.notifications = notifications; }
  dashboard() { return this.repository.dashboard(); }
  users(query) { const { limit, offset } = getPagination(query); return this.repository.users(query, limit, offset); }
  async setUserStatus(actorId, userId, status, requestId) {
    if (!['active', 'locked'].includes(status)) throw new AppError('Trạng thái không hợp lệ', 422);
    const user = await this.repository.setUserStatus(actorId, userId, status, requestId);
    if (!user) throw new AppError('Không tìm thấy người dùng hoặc không thể khóa admin', 404);
    return user;
  }
  rooms(query) { const { limit, offset } = getPagination(query); return this.repository.rooms(query.status, limit, offset); }
  async moderateRoom(actorId, roomId, input, requestId, correlationId) {
    if (!['active', 'rejected', 'hidden'].includes(input.status)) throw new AppError('Trạng thái không hợp lệ', 422);
    const room = await this.repository.moderateRoom(actorId, roomId, input.status, input.reason, requestId);
    if (!room) throw new AppError('Không tìm thấy phòng', 404);
    await this.notifications.create(room.landlord_id, input.status === 'active' ? 'room_approved' : 'room_rejected', input.status === 'active' ? 'Tin phòng đã được duyệt' : 'Tin phòng cần điều chỉnh', input.reason || room.title, `/rooms/${room.id}`);
    const type = input.status === 'active' ? 'RoomApproved' : 'RoomRejected';
    const event = this.messaging.createEvent?.(type, 'admin', { roomId }, correlationId);
    if (event) await this.messaging.publish(event);
    return room;
  }
  reports(query) { const { limit, offset } = getPagination(query); return this.repository.reports(query.status, limit, offset); }
  async resolveReport(actorId, reportId, input, requestId, correlationId) {
    if (!['reviewing', 'resolved', 'rejected'].includes(input.status)) throw new AppError('Trạng thái không hợp lệ', 422);
    const report = await this.repository.resolveReport(actorId, reportId, input, requestId);
    if (!report) throw new AppError('Không tìm thấy báo cáo', 404);
    await this.notifications.create(report.reporter_id, 'report_resolved', 'Báo cáo đã được xử lý', input.adminNote || 'Quản trị viên đã cập nhật báo cáo của bạn.', '/reports');
    const event = this.messaging.createEvent?.('ReportResolved', 'admin', { reportId }, correlationId);
    if (event) await this.messaging.publish(event);
    return report;
  }
}
module.exports = AdminService;

