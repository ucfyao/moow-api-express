const ccxt = require('ccxt');
const AipOrderModel = require('../models/aipOrderModel');
const AipExchangeKeyModel = require('../models/aipExchangeKeyModel');
const AipStrategyModel = require('../models/aipStrategyModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const { decrypt } = require('../utils/cryptoUtils');
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

  async getOrderStatistics(userId) {
    const strategies = await AipStrategyModel.find({
      user: userId,
      status: { $lt: AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED },
    })
      .select('_id')
      .lean();

    const strategyIds = strategies.map((s) => s._id.toString());

    if (strategyIds.length === 0) {
      return {
        total_orders: 0,
        buy_count: 0,
        sell_count: 0,
        total_buy_cost: 0,
        total_sell_revenue: 0,
        total_profit: 0,
      };
    }

    const result = await AipOrderModel.aggregate([
      { $match: { strategy_id: { $in: strategyIds } } },
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          buy_count: { $sum: { $cond: [{ $eq: ['$side', 'buy'] }, 1, 0] } },
          sell_count: { $sum: { $cond: [{ $eq: ['$side', 'sell'] }, 1, 0] } },
          total_buy_cost: {
            $sum: { $cond: [{ $eq: ['$side', 'buy'] }, '$base_total', 0] },
          },
          total_sell_revenue: {
            $sum: { $cond: [{ $eq: ['$side', 'sell'] }, '$value_total', 0] },
          },
          total_profit: { $sum: '$profit' },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        total_orders: 0,
        buy_count: 0,
        sell_count: 0,
        total_buy_cost: 0,
        total_sell_revenue: 0,
        total_profit: 0,
      };
    }

    const { _id, ...stats } = result[0];
    return stats;
  }

  async getOrderById(id) {
    const order = await AipOrderModel.findById(id).lean();
    if (!order) {
      throw new CustomError(STATUS_TYPE.AIP_ORDER_NOT_FOUND, 404);
    }
    return order;
  }

  async create(order) {
    const doc = new AipOrderModel(order);
    await doc.save();
    const orderId = doc ? doc._id : '';

    return { _id: orderId };
  }

  /**
   * Resolve exchange credentials from a stored key ID
   * @param {string} keyId - The exchange key document ID
   * @returns {Object} { exchangeName, apiKey, secret }
   */
  async _resolveExchangeKey(keyId) {
    const exchangeKey = await AipExchangeKeyModel.findById(keyId);
    if (!exchangeKey) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Exchange key not found');
    }
    return {
      exchangeName: exchangeKey.exchange,
      apiKey: decrypt(exchangeKey.access_key),
      secret: decrypt(exchangeKey.secret_key),
    };
  }

  async getThirdPartyOrders(keyId, symbol) {
    const { exchangeName, apiKey, secret } = await this._resolveExchangeKey(keyId);
    const exchange = new ccxt[exchangeName]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });
    const openOrders = await exchange.fetchOpenOrders(symbol);
    return openOrders;
  }

  async cancelAllOpenThirdPartyOrders(keyId, symbol) {
    const { exchangeName, apiKey, secret } = await this._resolveExchangeKey(keyId);
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
