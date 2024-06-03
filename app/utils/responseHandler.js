const { STATUS_MESSAGE } = require('./statusCodes');

class ResponseHandler {
  static success(res, data = {}, httpCode = 200, businessCode = 0, message = '') {
    res.status(httpCode).json({
      code: businessCode,
      message: message || STATUS_MESSAGE[businessCode] || STATUS_MESSAGE[httpCode] || 'Success',
      data
    });
  }

  static fail(res, httpCode = 500, businessCode = 50000, message = '', data = {}) {
    console.log(httpCode,businessCode,message)
    res.status(httpCode).json({
      code: businessCode,
      message: message || STATUS_MESSAGE[businessCode] || STATUS_MESSAGE[httpCode] || 'Error',
      data
    });
  }
}

module.exports = ResponseHandler;
