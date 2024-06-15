const { STATUS_TYPE, STATUS_MESSAGE } = require('./statusCodes');

class RenderBodyHandler {
  static renderBody(params) {
    if (typeof params.statusType === 'undefined') {
      params.statusType = STATUS_TYPE.GLOBAL_SUCCESS;
    }

    const response = {
      data: params.data || {},
      message: params.message || STATUS_MESSAGE[params.statusType],
      status: params.statusType,
    };

    if (params.error) {
      response.error = params.error;
      } else if (params.statusType !== STATUS_TYPE.GLOBAL_SUCCESS) {
      response.error = params.message || STATUS_MESSAGE[params.statusType];
    }

    return response;
  }
}

module.exports = RenderBodyHandler;
