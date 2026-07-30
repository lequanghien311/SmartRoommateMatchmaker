const { success, noContent } = require('../../shared/responses');

class FavoritesController {
  constructor(service) {
    this.service = service;
  }
  add = async (req, res, next) => {
    try {
      success(res, await this.service.add(req.user.id, req.params.roomId, req.correlationId), 'Đã thêm vào yêu thích', {}, 201);
    } catch (error) {
      next(error);
    }
  };
  remove = async (req, res, next) => {
    try {
      await this.service.remove(req.user.id, req.params.roomId);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
  list = async (req, res, next) => {
    try {
      success(res, await this.service.list(req.user.id, req.query));
    } catch (error) {
      next(error);
    }
  };
}
module.exports = FavoritesController;

