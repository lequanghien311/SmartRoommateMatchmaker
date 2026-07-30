const { success, noContent } = require('../../shared/responses');

class MediaController {
  constructor(service) {
    this.service = service;
  }

  upload = async (req, res, next) => {
    try {
      success(res, await this.service.upload(req.params.roomId, req.user, req.files || []), 'Tải ảnh thành công', {}, 201);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      await this.service.remove(req.params.imageId, req.user);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };

  cover = async (req, res, next) => {
    try {
      success(res, await this.service.cover(req.params.roomId, req.params.imageId, req.user), 'Đã chọn ảnh đại diện');
    } catch (error) {
      next(error);
    }
  };

  reorder = async (req, res, next) => {
    try {
      await this.service.reorder(req.params.roomId, req.body.imageIds, req.user);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = MediaController;

