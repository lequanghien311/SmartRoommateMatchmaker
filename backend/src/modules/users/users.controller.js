const { success } = require('../../shared/responses');

class UsersController {
  constructor(service) {
    this.service = service;
  }

  publicProfile = async (req, res, next) => {
    try {
      success(res, await this.service.getPublic(req.params.id));
    } catch (error) {
      next(error);
    }
  };

  me = async (req, res, next) => {
    try {
      success(res, await this.service.getMe(req.user.id));
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      success(res, await this.service.update(req.user.id, req.body), 'Cập nhật hồ sơ thành công');
    } catch (error) {
      next(error);
    }
  };

  activity = async (req, res, next) => {
    try {
      success(res, await this.service.activity(req.user.id));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = UsersController;

