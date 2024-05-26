const strategyService = require('../services/strategyService')
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');

class StrategyController {

  async getAllStrategies(req, res) {
    try {
      const strategy = await strategyService.getAllStrategies();
      ResponseHandler.success(res, strategy);
    } catch (error) { 
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async getStrategyById(req, res) {
    try {
      const strategy = await strategyService.getStrategyById(req.params.id);
      if (strategy) {
        ResponseHandler.success(res, strategy);
      } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Strategy not found');
      }
    } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
  }

}

module.exports = new StrategyController();

