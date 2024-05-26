const strategyService = require('../services/strategyService')
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');

class StrategyController {

  async getAllStrategies(req, res) {
    try {
      const strategy = await strategyService.getAllStrategies();
      ResponseHandler.success(res, strategy);
    } catch (error) { 
      ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, error.message);
    }
  }

  async getStrategyById(req, res) {
    try {
      const strategy = await strategyService.getStrategyById(req.params.id);
      if (strategy) {
        ResponseHandler.success(res, strategy);
      } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, 'Strategy not found');
      }
    } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, error.message);
      }
  }
}

module.exports = new StrategyController();

