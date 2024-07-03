const ccxt = require('ccxt');
const Order = require('../models/orderModel');
const Strategy = require('../models/strategyModel');
const Await = require('../models/awaitModel');
const { decrypt } = require('../utils/cryptoUtils');
const {
  STRATEGY_TYPE,
  DRAWDOWN_STATUS,
  AWAIT_STATUS,
  AWAIT_SELL_TYPE,
} = require('../utils/strategyStateEnum');

class OrderService {
  async getAllOrders(strategyId) {
    const pageNumber = 1;
    const pageSize = 9999;
    const list = await Order.find({ strategy_id: strategyId })
      .sort({ createdAt: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    return { list };
  }

  async create(order) {
    const doc = new Order(order);
    // const secret = await encrypt(strategy.secret);  // for testing
    // doc.secret = secret;
    await doc.save();
    const orderId = doc ? doc._id : '';

    return { _id: orderId };
  }

  async place(strategyId) {
    const strategy = await Strategy.findById(strategyId);
    const secret = await decrypt(strategy.secret);
    const exchange = new ccxt[strategy.exchange]({
      apiKey: strategy.key,
      secret,
      timeout: 60000,
    });

    const type = 'market';
    const side = 'buy';
    const ticker = await exchange.fetchTicker(strategy.symbol);
    const price = ticker.ask;

    // TODO: make sure to reach the minimum amount and prize by const markets = await exchange.loadMarkets()[strategy.symbol];

    let amount = 0;
    // Fetch the current price, calculate purchase amount this time by type
    if (strategy.type === STRATEGY_TYPE.NORMAL) {
      amount = (strategy.base_limit / price).toFixed(6);
    } else {
      amount = _valueAveraging(strategy).toFixed(6);
      if (amount <= 0) {
        return false;
      }
    }

    const balance = await exchange.fetchBalance();
    // console.log(balance);
    const inParams = {};
    const orderRes = exchange.createOrder(strategy.symbol, type, side, amount, price, inParams);

    const buyTimes = strategy.buy_times + 1;
    const nowBuyTimes = strategy.now_buy_times + 1;
    const inOrder = {
      strategy_id: strategy._id,
      order_id: orderRes.id,
      type,
      side,
      price,
      amount,
      symbol: strategy.symbol,
      funds: strategy.base_limit,
      avg_price: 0,
      deal_amount: 0,
      cost: 0,
      status: 'open',
      mid: strategy.user_market_id,
      record_amount: 0,
      record_cost: 0,
      buy_times: buyTimes,
      now_buy_times: nowBuyTimes,
      quote_total: strategy.quote_total,
      value_total: strategy.quote_total * price,
      base_total: strategy.base_total,

      now_base_total: strategy.now_base_total,
      now_quote_total: strategy.now_quote_total,
      pl_created_at: Date.now(),
      created_at: Date.now(),
    };

    await new Order(inOrder).save();
    strategy.buy_times = buyTimes;
    strategy.now_buy_times = nowBuyTimes;
    await strategy.save();

    return { order_id: inOrder.order_id };
  }

  async sell(strategyId) {
    const item = await Strategy.findById(strategyId);
    // Access the current price
    const exchange = new ccxt[item.exchange]({
      apiKey: item.key,
      secret: item.secret,
      timeout: 5000,
    });

    const profit = item.quote_total * sellPrice - item.base_total;
    const profitPercentage = (profit / item.base_total) * 100;
    // Check if the profit reach the setting take-profit rate
    await this.checkProfitRate(item, profitPercentage);

    const tickerRes = await exchange.fetchTicker(item.symbol);
    const sellPrice = tickerRes.bid;
    // Check the peak pullback
    await this.checkPeakPullback(item, sellPrice);
  }

  async sellout(doc) {
    const conditions = {
      strategy_id: doc._id,
      user: doc.user,
      sell_type: AWAIT_SELL_TYPE.AUTO_SELL,
      await_status: AWAIT_STATUS.WAITING,
    };

    const data = await new Await(conditions).save();
    const id = data ? data._id : '';
    const strategyId = data ? data.strategy_id : '';

    return { id, strategy_id: strategyId };
  }

  async checkProfitRate(item, profitPercentage) {
    if (!item.stop_profit_percentage || !item.drawdown) {
      return;
    }
    // Lower than the setting take-profit rate, exit
    if (profitPercentage < item.stop_profit_percentage) {
      return false;
    }

    // When the take-profit level is reached and no peak has been set, sell out
    if (item.drawdown_status === DRAWDOWN_STATUS.DISABLED || item.drawdown <= 0) {
      item.sell_price = sellPrice;
      await this.sellout(item);
    }
  }

  async checkPeakPullback(item, sellPrice) {
    if (item.drawdown_status === DRAWDOWN_STATUS.ENABLED && item.drawdown > 0) {
      // If pullback is set, compare current price with the last locked price
      await this.checkCurrentPrice(item, sellPrice);
    }
  }

  async checkCurrentPrice(item, sellPrice) {
    // If the current price is lower, sell out
    if (
      item.drawdown_price !== 'undefined' &&
      sellPrice <= item.drawdown_price * (1 - item.drawdown / 100)
    ) {
      item.sell_price = sellPrice;
      await this.sellout(item);
    } else {
      // If the current price is higher, reset the locked price
      item.drawdown_price = sellPrice;
      await item.save();
    }
  }
}

module.exports = new OrderService();
