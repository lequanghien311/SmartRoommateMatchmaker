const { body } = require('express-validator');

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
  .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .withMessage('Mật khẩu phải có ít nhất một chữ và một số');

const register = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('phone').matches(/^0\d{9}$/).withMessage('Số điện thoại phải gồm 10 chữ số'),
  body('fullName').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ'),
  body('role').isIn(['tenant', 'landlord']).withMessage('Vai trò không hợp lệ'),
  passwordRule,
];

const login = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .withMessage('Mật khẩu mới phải có ít nhất một chữ và một số'),
];

module.exports = { register, login, changePassword };

