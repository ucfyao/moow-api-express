const Strategy = require('../models/strategyModel');

class StrategyService {

  async getAllStrategies() {
    return Strategy.find();
  }

  async getStrategyById(id) {
    return Strategy.findById(id);
  }

  // create a strategy
  async createStrategy(StrategyData) {
    // if (typeof StrategyData !== 'object' || StrategyData === null) {
    //   console.error('Service StrategyData:', StrategyData); // Debug log
    //   throw new Error('Invalid argument: StrategyData must be an object');
    // }
    const strategy = new Strategy(StrategyData);
    return strategy.save();
  }
}

module.exports = new StrategyService();


