const { body } = require('express-validator');
module.exports = [
  body('roomId').isUUID().withMessage('ID phòng không hợp lệ'),
  body('reason').isIn(['incorrect_info', 'wrong_price', 'scam', 'wrong_images', 'inappropriate', 'expired', 'other']).withMessage('Lý do không hợp lệ'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 ký tự'),
];

