const EachStrategy = require('../models/getEachStrategyModel');

class EachStrategyService {

  async getAllStrategies() {
    return EachStrategy.find();
  }

  async getStrategyById(id) {
    return EachStrategy.findById(id);
  }

  async createEachStrategy(EachStrategyData) {
    if (typeof EachStrategyData !== 'object' || EachStrategyData === null) {
      console.error('Service EachStrategyData:', EachStrategyData); // Debug log
      throw new Error('Invalid argument: EachStrategyData must be an object');
    }
    const eachstrategy = new Market(EachStrategyData);
    return eachstrategy.save();
  }
}

module.exports = new EachStrategyService();


