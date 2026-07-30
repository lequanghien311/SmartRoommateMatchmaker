const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../errors/AppError');
const { pool } = require('../../database/connection');

async function authenticate(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) throw new AppError('Bạn chưa đăng nhập', 401);
    const payload = jwt.verify(header.slice(7), env.jwtSecret);
    const result = await pool.query(
      'SELECT id, email, full_name, role, status FROM users WHERE id = $1 AND deleted_at IS NULL',
      [payload.sub],
    );
    if (!result.rowCount) throw new AppError('Tài khoản không tồn tại', 401);
    if (result.rows[0].status === 'locked') throw new AppError('Tài khoản đã bị khóa', 403);
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401));
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };

