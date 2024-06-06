const Strategy = require('../models/strategyModel');

class StrategyService {

  async getAllStrategies() {
    return Strategy.find();
  }

  async getStrategyById(id) {
    return Strategy.findById(id);
  }

  // create a strategy
  async createStrategy(strategyData) {
    // if (typeof StrategyData !== 'object' || StrategyData === null) {
    //   console.error('Service StrategyData:', StrategyData); // Debug log
    //   throw new Error('Invalid argument: StrategyData must be an object');
    // }
    const strategy = new Strategy(strategyData);
    return strategy.save();
  }

  // update a strategy
  async updateStrategy(id, updateData) {
    // const strategy = new Strategy(updateData);
    return Strategy.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new StrategyService();


