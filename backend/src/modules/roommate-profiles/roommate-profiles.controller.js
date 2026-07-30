const { success } = require('../../shared/responses');

class RoommateProfilesController {
  constructor(service) {
    this.service = service;
  }
  get = async (req, res, next) => {
    try {
      success(res, await this.service.get(req.user.id));
    } catch (error) {
      next(error);
    }
  };
  upsert = async (req, res, next) => {
    try {
      success(res, await this.service.upsert(req.user.id, req.body), 'Lưu hồ sơ ở ghép thành công');
    } catch (error) {
      next(error);
    }
  };
}
module.exports = RoommateProfilesController;

