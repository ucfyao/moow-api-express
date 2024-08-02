const ccxt = require('ccxt');
const AipOrderModel = require('../models/aipOrderModel');
const logger = require('../utils/logger');
const config = require('../../config');

class OrderService {
  async getAllOrders(strategyId) {
    const pageNumber = 1;
    const pageSize = 9999;
    const list = await AipOrderModel.find({ strategy_id: strategyId })
      .sort({ created_at: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    return { list };
  }

  async create(order) {
    const doc = new AipOrderModel(order);
    // const secret = await encrypt(strategy.secret);  // for testing
    // doc.secret = secret;
    await doc.save();
    const orderId = doc ? doc._id : '';

    return { _id: orderId };
  }

  async getThirdPartyOrders(exchangeName, symbol, apiKey, secret) {
    console.log(apiKey, secret);
    const exchange = new ccxt[exchangeName]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });
    const openOrders = await exchange.fetchOpenOrders(symbol);
    openOrders.forEach(order => {
      const timestamp = new Date(order.timestamp);
      const formattedDate = timestamp.toISOString();
      logger.info(`Order ID: ${order.id}`);
      logger.info(`Symbol: ${order.symbol}`);
      logger.info(`Type: ${order.type}`);
      logger.info(`Side: ${order.side}`);
      logger.info(`Price: ${order.price}`);
      logger.info(`Amount: ${order.amount}`);
      logger.info(`Status: ${order.status}`);
      logger.info(`Timestamp: ${formattedDate}`);
      logger.info('-----------------------------------');
    });
    return openOrders;
  }

  async cancelAllOpenThirdPartyOrders(exchangeName, symbol, apiKey, secret) {
    const exchange = new ccxt[exchangeName]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });
    const orders = await exchange.cancelAllOrders(symbol);
    return orders;
  }
}

module.exports = new OrderService();
