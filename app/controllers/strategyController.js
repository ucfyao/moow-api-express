const StrategyService = require('../services/strategyService');
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
    // TODO Parameter verification and conversion
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

  /**
   * Execute buy operations for all strategies
   * @param {Request} req
   * @param {Response} res
   */
  async executeAllBuys(req, res) {
    try {
      const result = await StrategyService.executeAllBuys();
      res.status(200).json({ message: 'All strategies executed successfully', result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Execute buy operation for a single strategy
   * @param {Request} req
   * @param {Response} res
   */
  async executeBuy(req, res) {
    try {
      const { strategyId } = req.params;
      const result = await StrategyService.executeBuy(strategyId);
      res.status(200).json({ message: `Strategy ${strategyId} executed successfully`, result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Method to detect sell signal and execute corresponding operation
  async executeSell(req, res) {
    const { strategyId } = req.params;

    const result = await StrategyService.executeSell(strategyId);
    res.json({ sell: result });
  }
}

module.exports = new StrategyController();
