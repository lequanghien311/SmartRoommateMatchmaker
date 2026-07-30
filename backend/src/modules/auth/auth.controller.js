const { success, noContent } = require('../../shared/responses');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      const data = await this.service.register(req.body, req.correlationId);
      success(res, data, 'Đăng ký thành công', {}, 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      success(res, await this.service.login(req.body.email, req.body.password), 'Đăng nhập thành công');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      success(res, await this.service.refresh(req.body.refreshToken), 'Làm mới phiên thành công');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      await this.service.logout(req.body.refreshToken);
      noContent(res);
    } catch (error) {
      next(error);
    }
  };

  me = async (req, res) => success(res, req.user, 'Lấy thông tin thành công');

  changePassword = async (req, res, next) => {
    try {
      await this.service.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword,
        req.user.email,
      );
      noContent(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;

