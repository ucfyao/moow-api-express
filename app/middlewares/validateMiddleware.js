const { validationResult, checkSchema } = require('express-validator');
const { STATUS_TYPE } = require('../constants/statusCodes');
const ResponseHandler = require('../utils/responseHandler');

const validateParams = (schema) => {
  return [
    checkSchema(schema),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const paramErrors = errors.array().map(err => ({
          [err.path]: err.msg,
        }));
        return ResponseHandler.fail(
          res,
          STATUS_TYPE.badRequest,
          STATUS_TYPE.paramsError,
          paramErrors
        );
      }
      next();
    }
  ];
};

module.exports = validateParams;