const { success } = require('../../shared/responses');
class MatchingController {
  constructor(service) {
    this.service = service;
  }
  list = async (req, res, next) => {
    try {
      success(res, await this.service.calculate(req.user.id, req.correlationId), 'Đã tính mức độ tương thích');
    } catch (error) {
      next(error);
    }
  };
  detail = async (req, res, next) => {
    try {
      success(res, await this.service.detail(req.user.id, req.params.candidateId));
    } catch (error) {
      next(error);
    }
  };
}
module.exports = MatchingController;

