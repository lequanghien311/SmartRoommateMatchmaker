const { success, noContent } = require('../../shared/responses');

class RoomsController {
  constructor(service) {
    this.service = service;
  }

  search = async (req, res, next) => {
    try {
      const result = await this.service.search(req.query);
      success(res, result.data, 'Lấy danh sách phòng thành công', result.meta);
    } catch (error) {
      next(error);
    }
  };

  detail = async (req, res, next) => {
    try {
      success(res, await this.service.detail(req.params.id));
    } catch (error) {
      next(error);
    }
  };

  manage = async (req, res, next) => {
    try {
      success(res, await this.service.manage(req.params.id, req.user));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      success(res, await this.service.create(req.user.id, req.body, req.correlationId), 'Tạo phòng thành công', {}, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      success(res, await this.service.update(req.params.id, req.user, req.body), 'Cập nhật phòng thành công');
    } catch (error) {
      next(error);
    }
  };

  transition = async (req, res, next) => {
    try {
      success(res, await this.service.transition(req.params.id, req.user, req.body.status, req.body.reason, req.correlationId), 'Cập nhật trạng thái thành công');
    } catch (error) {
      next(error);
    }
  };

  mine = async (req, res, next) => {
    try {
      success(res, await this.service.mine(req.user.id, req.query));
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.service.remove(req.params.id, req.user);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RoomsController;
