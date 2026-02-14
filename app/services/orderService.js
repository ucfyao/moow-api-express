const ccxt = require('ccxt');
const AipOrderModel = require('../models/aipOrderModel');
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
    await doc.save();
    const orderId = doc ? doc._id : '';

    return { _id: orderId };
  }

  // TODO: Accept keyId instead of raw credentials, decrypt server-side
  async getThirdPartyOrders(exchangeName, symbol, apiKey, secret) {
    const exchange = new ccxt[exchangeName]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });
    const openOrders = await exchange.fetchOpenOrders(symbol);
    return openOrders;
  }

  // TODO: Accept keyId instead of raw credentials, decrypt server-side
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
