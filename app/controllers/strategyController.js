const StrategyService = require('../services/strategyService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class StrategyController {
  /**
   * Get a list of all strategies by params
   * @param {Request} req
   * @param {Response} res
   */
  async index(req, res) {
    const params = req.body;
    params.userId = req.userId;
    const strategies = await StrategyService.getAllStrategies(params);
    return ResponseHandler.success(res, strategies);
  }

  /**
   * Get a specific strategy
   * @param {Request} req
   * @param {Response} res
   */
  async show(req, res) {
    const strategyId = req.params.id;
    const strategy = await StrategyService.getStrategyById(strategyId);
    return ResponseHandler.success(res, strategy);
  }

  /**
   * Create a new strategy
   * @param {Request} req
   * @param {Response} res
   */
  async create(req, res) {
    const strategyData = req.body;
    strategyData.user = req.userId;

    try {
      const strategy = await StrategyService.createStrategy(strategyData);
      return ResponseHandler.success(res, strategy, STATUS_TYPE.created);
    } catch (error) {
      return ResponseHandler.fail(res, { message: 'Create failed', error: error.message });
    }
  }

  // partially update a strategt
  async patch(req, res) {
    const updateData = req.body;
    const strategy = await StrategyService.partiallyUpdateStrategy(req.params.id, updateData);
    return ResponseHandler.success(res, strategy);
  }

  // delete a strategt
  async destroy(req, res) {
    const strategy = await StrategyService.getStrategyById(req.params.id);
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
