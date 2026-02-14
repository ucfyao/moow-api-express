const AipAwaitModel = require('../models/aipAwaitModel');
const AipStrategyModel = require('../models/aipStrategyModel');
const logger = require('../utils/logger');
const OrderService = require('./orderService');
const config = require('../../config');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ccxt = require('ccxt');

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
    const newAwait = await new AipAwaitModel(conditions).save();
    logger.info(`\nNew Await\n  Strategy Id: \t${conditions.strategy_id}\n  User: \t${conditions.user}\n  Response Time: \t${Date.now() - start} ms\n`);
    
    return newAwait;
  }

  /**
   * Get all pending orders information.
   * @param {object} conditions 
   */
  async index(conditions) {
    const awaitOrders = await AipAwaitModel.find(conditions); 
    return awaitOrders;
  }

  /**
   * Update the status of all pending orders
   * @param {object} conditions
   */
  async update(conditions) {
    const updatedOrders = await AipAwaitModel.updateMany(conditions, {'await_status': AipAwaitModel.STATUS_PROCESSING});
    return updatedOrders;
  }

  /**
   * Execute a sell operation on a third-party platform based on the await database and add the results to the order database.
   * @param {object} strategy 
   * @param {object} awaitOrder 
   * @returns 
   */
  async sellOnThirdParty(strategy, awaitOrder) {
    //TODO: encrypte and decrypte key and secret
    if (strategy.exchange === undefined) {
      logger.info('[' + strategy._id + '] - exchange is null , call user !');
      return;
    }
    const exchange = new ccxt[strategy.exchange]({
      apiKey: strategy.key,
      secret: strategy.secret,
      timeout: config.exchangeTimeOut
    });
    const type = 'market';
    const side = 'sell';
    const orderRes = await exchange.createOrder(
      strategy.symbol, type, side, strategy.now_quote_total,
    );

    logger.info(`[order id ] - ${orderRes.id}`);

    await sleep(5000);

    const orderInfo = await exchange.fetchOrder(orderRes.id, strategy.symbol);
    logger.info(`[order info] - ${JSON.stringify(orderInfo.info)}`);
    const sellTimes = strategy.sell_times + 1;
    strategy.sell_price =  orderInfo.average;
    strategy.sell_times =  sellTimes;

    let profit = strategy.quote_total * strategy.sell_price - strategy.base_total;
    let profitPercentage = profit / strategy.base_total * 100;

    // create order
    const newOrder = {
      strategy_id: strategy._id,
      order_id: orderRes.id,
      type,
      side,
      price: orderInfo.average,
      amount: orderInfo.amount,
      funds: strategy.now_quote_total * orderInfo.average,
      avg_price: orderInfo.average,
      deal_amount: orderInfo.amount,
      cost: orderInfo.filled,
      status: orderInfo.status,
      symbol: strategy.symbol,
      mid: strategy.user_market_id,
      base_total: strategy.base_total,
      quote_total: strategy.quote_total,
      value_total: strategy.quote_total * strategy.sell_price,
      now_base_total: strategy.now_base_total,
      now_quote_total: strategy.now_base_total,
      sell_times: sellTimes,
      now_buy_times: strategy.now_buy_times,
      buy_times: strategy.buy_times,
      profit,
      profit_percentage: profitPercentage,
      record_amount: orderInfo.amount,
      record_cost: orderInfo.cost,
      pl_create_at: new Date(),
    };

    const createOrder = await OrderService.create(newOrder);
    logger.info(`[new order] - ${createOrder._id}`);

    awaitOrder.await_status = AipAwaitModel.STATUS_COMPLETED;
    await awaitOrder.save();

    if (awaitOrder.sell_type === AipAwaitModel.SELL_TYPE_AUTO_SELL) {
      //auto_create filed is not in the strategy module
      if (strategy.auto_create === 'Y') {
        strategy.now_base_total = 0 ;
        strategy.now_buy_times= 0;
        strategy.value_total = 0;
        logger.info(`Automatically restart after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `);
      }else{
        strategy.status = AipStrategyModel.STRATEGY_STATUS_CLOSED;
        strategy.stop_reason = 'profit auto sell';
        logger.info(`Automatically close after selling:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `);
  
      }
    } else if (awaitOrder.sell_type === AipAwaitModel.SELL_TYPE_DEL_INVEST) {
      strategy.status = AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED;
      strategy.stop_reason = 'user delete sell';
      logger.info(`User deleted investment:\n Investment ID: \t${strategy._id}\n Investment Info: \t${strategy}\n `);
    }

    await strategy.save();
  }
}

module.exports = new AwaitService();