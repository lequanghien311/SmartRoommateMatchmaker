const AppError = require('../errors/AppError');

function notFound(req, _res, next) {
  next(new AppError(`Không tìm thấy ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, _next) {
  const status =
    error.statusCode ||
    (error.name === 'MulterError' ? 422 : error.code === '23505' ? 409 : 500);
  const isProduction = process.env.NODE_ENV === 'production';
  req.logger?.error('request_failed', {
    requestId: req.id,
    status,
    message: error.message,
    stack: isProduction ? undefined : error.stack,
  });
  res.status(status).json({
    success: false,
    message: status === 500 && isProduction ? 'Lỗi hệ thống' : error.message,
    errors: error.errors || [],
  });
}

module.exports = { notFound, errorHandler };
