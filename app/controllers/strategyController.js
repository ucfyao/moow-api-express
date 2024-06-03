const StrategyService = require('../services/strategyService')
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class StrategyController {

  async getAllStrategies(req, res) {
    const strategies = await StrategyService.getAllStrategies();
    return ResponseHandler.success(res, strategies);
  }

  async getStrategyById(req, res) {
    const strategy = await StrategyService.getStrategyById(req.params.id);
    return ResponseHandler.success(res, strategy);
  }

  // create a strategy
  async createStrategy(req, res) {
    const strategyData = req.body;
    const strategy = await StrategyService.createStrategy(strategyData);
    return ResponseHandler.success(res, strategy, STATUS_TYPE.created);
  }

  // update a strategt
  async updateStrategy(req, res) {
    const updateData = req.body;
    const strategy = await StrategyService.updateStrategy(req.params.id, updateData);
    return ResponseHandler.success(res, strategy);
  }
}

module.exports = new StrategyController();

