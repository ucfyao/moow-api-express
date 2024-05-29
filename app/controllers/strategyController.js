const StrategyService = require('../services/strategyService')
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');

class StrategyController {

  async getAllStrategies(req, res) {
    try {
      const strategy = await StrategyService.getAllStrategies();
      ResponseHandler.success(res, strategy, STATUS_TYPE.created);
    } catch (error) { 
      ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, error.message);
    }
  }

  async getStrategyById(req, res) {
    try {
      const strategy = await StrategyService.getStrategyById(req.params.id);
      if (strategy) {
        ResponseHandler.success(res, strategy);
      } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, 'Strategy not found');
      }
    } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, error.message);
      }
  }

  // create a strategy
  async createStrategy(req, res){
    try {
      const strategyData = req.body;
      // console.log(strategyData);
      const strategy = await StrategyService.createStrategy( strategyData );
      ResponseHandler.success(res, strategy, STATUS_TYPE.created);
    } catch (error) { 
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, 
        STATUS_TYPE.internalServerError, error.message);
    }
  }

}

module.exports = new StrategyController();

