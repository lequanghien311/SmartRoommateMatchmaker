const { success } = require('../../shared/responses');
class ReportsController {
  constructor(service) { this.service = service; }
  create = async (req, res, next) => { try { success(res, await this.service.create(req.user.id, req.body, req.correlationId), 'Gửi báo cáo thành công', {}, 201); } catch (error) { next(error); } };
  list = async (req, res, next) => { try { success(res, await this.service.list(req.user.id, req.query)); } catch (error) { next(error); } };
}
module.exports = ReportsController;

