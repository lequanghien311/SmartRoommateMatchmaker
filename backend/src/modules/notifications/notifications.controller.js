const { success, noContent } = require('../../shared/responses');
class NotificationsController {
  constructor(service) { this.service = service; }
  list = async (req, res, next) => { try { success(res, await this.service.list(req.user.id, req.query)); } catch (error) { next(error); } };
  unread = async (req, res, next) => { try { success(res, { count: await this.service.unread(req.user.id) }); } catch (error) { next(error); } };
  read = async (req, res, next) => { try { success(res, await this.service.read(req.user.id, req.params.id), 'Đã đánh dấu đọc'); } catch (error) { next(error); } };
  readAll = async (req, res, next) => { try { await this.service.readAll(req.user.id); noContent(res); } catch (error) { next(error); } };
}
module.exports = NotificationsController;

