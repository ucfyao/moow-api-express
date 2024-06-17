const Strategy = require('../models/strategyModel');
class StrategyService {

  async getAllStrategies() {
    return Strategy.find();
  }

  async getStrategyById( strategy_id ){
    const info = await Strategy.findById(strategy_id);
    return { info };
  }

  async createStrategy( strategy ) {
    strategy.minute = '' + parseInt(60 * Math.random());
    strategy.hour = '' + parseInt(24 * Math.random());
    
    const doc = new Strategy(strategy);
    // const secret = await encrypt(strategy.secret);  // for testing
    // doc.secret = secret; 
    await doc.save();
    const strategyId = doc ? doc._id : '';
    
    return { _id: strategyId };
  }
}

module.exports = new StrategyService();


