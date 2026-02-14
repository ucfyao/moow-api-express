const { validationResult, checkSchema } = require('express-validator');
const { STATUS_TYPE } = require('../utils/statusCodes');
const ResponseHandler = require('../utils/responseHandler');

const validateParams = (schema) => [
  checkSchema(schema),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const paramErrors = errors.array().map((err) => ({
        [err.path]: err.msg,
      }));
      return ResponseHandler.fail(
        res,
        STATUS_TYPE.HTTP_BAD_REQUEST,
        STATUS_TYPE.COMMON_PARAMS_ERROR,
        paramErrors,
      );
    }
    next();
  },
];

module.exports = validateParams;
