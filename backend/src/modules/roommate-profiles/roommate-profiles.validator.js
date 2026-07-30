const { body } = require('express-validator');

module.exports = [
  body('budgetMin').isFloat({ min: 0 }).withMessage('Ngân sách tối thiểu không hợp lệ'),
  body('budgetMax').isFloat({ min: 0 }).custom((value, { req }) => Number(value) >= Number(req.body.budgetMin))
    .withMessage('Ngân sách tối đa phải lớn hơn hoặc bằng tối thiểu'),
  body('preferredProvince').trim().notEmpty().withMessage('Tỉnh/thành phố là bắt buộc'),
  body('sleepTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ ngủ không hợp lệ'),
  body('wakeTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ thức không hợp lệ'),
  body('cleanliness').isInt({ min: 1, max: 5 }).withMessage('Mức sạch sẽ từ 1 đến 5'),
  body('noiseTolerance').isInt({ min: 1, max: 5 }).withMessage('Mức chịu tiếng ồn từ 1 đến 5'),
  body('cookingFrequency').isInt({ min: 1, max: 5 }).withMessage('Tần suất nấu ăn từ 1 đến 5'),
  body('preferredGender').optional().isIn(['male', 'female', 'other', 'any']).withMessage('Giới tính mong muốn không hợp lệ'),
  body('habits').optional().isLength({ max: 2000 }).withMessage('Mô tả thói quen quá dài'),
];

