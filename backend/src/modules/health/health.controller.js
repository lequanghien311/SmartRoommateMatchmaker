const { success } = require('../../shared/responses');
class HealthController {
  constructor(service) { this.service = service; }
  basic = (_req, res) => success(res, this.service.basic(), 'Dịch vụ đang hoạt động');
  database = async (_req, res, next) => { try { success(res, await this.service.databaseCheck()); } catch (error) { next(error); } };
  storage = async (_req, res, next) => { try { success(res, await this.service.storageCheck()); } catch (error) { next(error); } };
  messaging = async (_req, res, next) => { try { success(res, await this.service.messagingCheck()); } catch (error) { next(error); } };
  realtime = async (_req, res, next) => { try { success(res, await this.service.realtimeCheck()); } catch (error) { next(error); } };
  cache = async (_req, res, next) => { try { success(res, await this.service.cacheCheck()); } catch (error) { next(error); } };
}
module.exports = HealthController;

