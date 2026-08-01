const { body, param, query } = require('express-validator');

const id = [param('id').isUUID().withMessage('ID phòng không hợp lệ')];
const fields = (allOptional = false) => {
  const required = (chain) => (allOptional ? chain.optional() : chain);
  return [
    required(body('title')).trim().notEmpty().isLength({ max: 180 }).withMessage('Tiêu đề là bắt buộc'),
    required(body('description')).trim().isLength({ min: 20 }).withMessage('Mô tả phải có ít nhất 20 ký tự'),
    required(body('monthlyPrice')).isFloat({ gt: 0 }).withMessage('Giá phải lớn hơn 0'),
    body('deposit').optional().isFloat({ min: 0 }).withMessage('Tiền cọc không hợp lệ'),
    required(body('area')).isFloat({ gt: 0 }).withMessage('Diện tích phải lớn hơn 0'),
    required(body('address')).trim().notEmpty().withMessage('Địa chỉ là bắt buộc'),
    required(body('province')).trim().notEmpty().withMessage('Tỉnh/thành phố là bắt buộc'),
    required(body('district')).trim().notEmpty().withMessage('Quận/huyện là bắt buộc'),
    required(body('roomType')).trim().notEmpty().withMessage('Loại phòng là bắt buộc'),
    body('maxOccupants').optional().isInt({ min: 1 }).withMessage('Số người tối đa không hợp lệ'),
    body('availableRooms').optional().isInt({ min: 0 }).withMessage('Số phòng còn lại không hợp lệ'),
    body('amenityIds').optional().isArray({ max: 30 }).withMessage('Danh sách tiện ích không hợp lệ'),
  ];
};
const create = fields();
const update = fields(true);
const transition = [
  body('status').isIn(['pending', 'active', 'rejected', 'hidden', 'rented']).withMessage('Trạng thái không hợp lệ'),
  body('reason').optional().isLength({ max: 1000 }).withMessage('Lý do quá dài'),
];
const search = [
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Giá tối thiểu không hợp lệ'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Giá tối đa không hợp lệ'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Số mục không hợp lệ'),
];
const geocode = [
  body('address').trim().notEmpty().isLength({ max: 300 }).withMessage('Địa chỉ là bắt buộc'),
  body('ward').optional().trim().isLength({ max: 100 }).withMessage('Phường/xã không hợp lệ'),
  body('district').optional().trim().isLength({ max: 100 }).withMessage('Quận/huyện không hợp lệ'),
  body('province').optional().trim().isLength({ max: 100 }).withMessage('Tỉnh/thành phố không hợp lệ'),
];

module.exports = { id, create, update, transition, search, geocode };
