const AipAwaitModel = require('../models/aipAwaitModel');
const logger = require('../utils/logger');
//const strategyService = require('./strategyService');
// const orderService = require('./orderService');
// const config = require('../../config');
// const sleep = require('thread-sleep');

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

  // async sellAllOrders() {
  //   const start = Date.now();
  //   const conditions = {
  //     await_status: '1',
  //   };

  //   const awaitOrders = await AipAwaitModel.find(conditions); 
  //   logger.info('### Round time: %j', awaitOrders);
  //   const updateOrders = await AipAwaitModel.updateMany(conditions,{'await_status': '3'})
  //   logger.info('### Round time: %j', updateOrders);
  //   for (const awaitorder of awaitOrders) {
  //     sell(awaitorder);
  //   }

  //   logger.info('### Round time: %j', Date.now() - start);
  // }

  // async sell(awaitorder) {
  //   const strategy = await strategyService.getSingleStrategy(awaitorder.strategy_id);
  //   //TODO: encrypte and decrypte key and secret
  //   if (strategy.exchange === undefined) {
  //     logger.info('[' + strategy._id + '] - exchange is null , call user !');
  //     return;
  //   }
  //   const exchange = new ccxt[strategy.exchange]({
  //     apiKey: strategy.key,
  //     secret: strategy.secret,
  //     timeout: config.exchangeTimeOut
  //   });
  //   const type = 'market';
  //   const side = 'sell';
  //   // For real environment
  //   //const orderRes = await exchange.createOrder(strategy.symbol, type, side, strategy.now_quote_total);
  //   //for test
  //   const orderRes = await exchange.createOrder('EOS/USDT', 'limit', 'sell', 50, 100);

  //   logger.info('[order id ] - ' + orderRes.id);

  //   sleep(5000);

  //   const orderInfo = await exchange.fetchOrder(orderRes.id, strategy.symbol);
  //   logger.info('[order info] - ' + JSON.stringify(orderInfo.info));
  //   const sellTimes = strategy.sell_times + 1;
  //   strategy.sell_price =  orderInfo.average;
  //   strategy.sell_times =  sellTimes;

  //   let profit = strategy.quote_total * strategy.sell_price - strategy.base_total;
  //   let profitPercentage = profit / strategy.base_total * 100;

  //   // 下单成功后 , 创建订单
  //   const newOrder = {
  //     strategy_id: strategy._id,
  //     order_id: orderRes.id,
  //     type,
  //     side,
  //     price: orderInfo.average,
  //     amount: orderInfo.amount,
  //     funds: strategy.now_quote_total * orderInfo.average,
  //     avg_price: orderInfo.average,
  //     deal_amount: orderInfo.amount,
  //     cost: orderInfo.filled,
  //     status: orderInfo.status,
  //     symbol: strategy.symbol,
  //     mid: strategy.user_market_id,
  //     base_total: strategy.base_total,
  //     quote_total: strategy.quote_total,
  //     value_total: strategy.quote_total * strategy.sell_price,

  //     now_base_total: strategy.now_base_total,
  //     now_quote_total: strategy.now_base_total,
  //     sell_times: sellTimes,
  //     now_buy_times: strategy.now_buy_times,
  //     buy_times: strategy.buy_times,
  //     profit,
  //     profit_percentage: profitPercentage,
  //     record_amount: orderInfo.amount,
  //     record_cost: orderInfo.cost,
  //     pl_create_at: new Date(),
  //   };

  //   const createOrder = await orderService.create(newOrder);
  //   app.logger.info('[new order] - ' + createOrder._id);

  //   awaitorder.await_status = '2';
  //   await awaitorder.save();

  //   if (awaitorder.sell_type === '1') {
  //     if (strategy.auto_create === 'Y') {
  //       strategy.now_base_total = 0 ;
  //       strategy.now_buy_times= 0;
  //       strategy.value_total = 0;
  //       logger.info(`卖出后自动重新开启：\n  定投Id: \t%j\n  定投信息: \t%j\n `, strategy._id, strategy);
  //     }else{
  //       strategy.status = 2;
  //       strategy.stop_reason = 'profit auto sell';
  //       logger.info(`卖出后自动关闭：\n  定投Id: \t%j\n  定投信息: \t%j\n `, strategy._id, strategy);
  
  //     }
  //   } else if (awaitorder.sell_type === '2') {
  //     strategy.status = 3;
  //     strategy.stop_reason = 'user delete sell';
  //     logger.info(`用户删除定投：\n  定投Id: \t%j\n  定投信息: \t%j\n `, strategy._id, strategy);
  //   }

  //   await strategy.save();
  // }
}

module.exports = new AwaitService();