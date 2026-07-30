const { success } = require('../../shared/responses');

class AmenitiesController {
  constructor(service) {
    this.service = service;
  }
  list = async (_req, res, next) => {
    try {
      success(res, await this.service.list());
    } catch (error) {
      next(error);
    }
  };
  create = async (req, res, next) => {
    try {
      success(res, await this.service.create(req.body), 'Tạo tiện ích thành công', {}, 201);
    } catch (error) {
      next(error);
    }
  };
  update = async (req, res, next) => {
    try {
      success(res, await this.service.update(req.params.id, req.body), 'Cập nhật tiện ích thành công');
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AmenitiesController;

