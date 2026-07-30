const { validationResult } = require('express-validator');
const AppError = require('../errors/AppError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((item) => ({ field: item.path, message: item.msg }));
  return next(new AppError('Dữ liệu không hợp lệ', 422, errors));
}

module.exports = validate;

