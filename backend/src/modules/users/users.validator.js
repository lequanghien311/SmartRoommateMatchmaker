const { body, param } = require('express-validator');

const userId = [param('id').isUUID().withMessage('ID người dùng không hợp lệ')];
const update = [
  body('fullName').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ'),
  body('phone').optional().matches(/^0\d{9}$/).withMessage('Số điện thoại không hợp lệ'),
  body('birthDate').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),
  body('school').optional().trim().isLength({ max: 160 }).withMessage('Tên trường quá dài'),
  body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Giới thiệu quá dài'),
];

module.exports = { userId, update };

