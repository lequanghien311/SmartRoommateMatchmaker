const { body } = require('express-validator');

const uuidArray = (field) =>
  body(field)
    .optional()
    .isArray()
    .withMessage(`${field} phải là danh sách`)
    .custom((values) => values.every((value) => /^[0-9a-f-]{36}$/i.test(value)))
    .withMessage(`${field} chứa ID không hợp lệ`);

module.exports = { uuidArray };

