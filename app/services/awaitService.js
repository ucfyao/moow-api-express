const Await = require('../models/awaitModel');
const logger = require('../utils/logger');

class AwaitService {
  /**
   * Create an Await strategy
   * @param params - The params
   */
  async createAwait(params) {
    const start = Date.now();
    
    let conditions = {};
    if (typeof params.strategy_id !== 'undefined') conditions.strategy_id = params.strategy_id;
    if (typeof params.user !== 'undefined') conditions.user = params.user;
    if (typeof params.sell_type !== 'undefined') conditions.sell_type = params.sell_type;
    if (typeof params.await_status !== 'undefined') conditions.await_status = params.await_status;
    
    const newAwait = await new Await(conditions).save();

    logger.info(`\nNew Await\n  Strategy Id: \t${conditions.strategy_id}\n  User: \t${conditions.user}\n  Response Time: \t${Date.now() - start} ms\n`);
    
    return newAwait;
  }
}

module.exports = new AwaitService();