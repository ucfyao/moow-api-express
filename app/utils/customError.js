const { STATUS_MESSAGE } = require('./statusCodes');

class CustomError extends Error {
  constructor( businessCode, statusCode = 500, message = '') {
    super(message || STATUS_MESSAGE[businessCode] || STATUS_MESSAGE[statusCode] || 'Error');
    this.businessCode = businessCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;