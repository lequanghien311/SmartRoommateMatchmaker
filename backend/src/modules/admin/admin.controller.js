const { success } = require('../../shared/responses');
class AdminController {
  constructor(service) { this.service = service; }
  dashboard = async (_req, res, next) => { try { success(res, await this.service.dashboard()); } catch (error) { next(error); } };
  users = async (req, res, next) => { try { success(res, await this.service.users(req.query)); } catch (error) { next(error); } };
  userStatus = async (req, res, next) => { try { success(res, await this.service.setUserStatus(req.user.id, req.params.id, req.body.status, req.id)); } catch (error) { next(error); } };
  rooms = async (req, res, next) => { try { success(res, await this.service.rooms(req.query)); } catch (error) { next(error); } };
  roomStatus = async (req, res, next) => { try { success(res, await this.service.moderateRoom(req.user.id, req.params.id, req.body, req.id, req.correlationId)); } catch (error) { next(error); } };
  reports = async (req, res, next) => { try { success(res, await this.service.reports(req.query)); } catch (error) { next(error); } };
  reportStatus = async (req, res, next) => { try { success(res, await this.service.resolveReport(req.user.id, req.params.id, req.body, req.id, req.correlationId)); } catch (error) { next(error); } };
}
module.exports = AdminController;

