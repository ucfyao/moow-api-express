const ccxt = require('ccxt');
const Strategy = require('../models/strategyModel');
// const { decrypt, encrypt } = require('../utils/cryptoUtils');
const { STRATEGY_TYPE } = require('../utils/strategyStateEnum');
const logger = require('../utils/logger');
const orderService = require('./orderService');

class StrategyService {
  async getAllStrategies() {
    return Strategy.find();
  }

  async getStrategyById(strategy_id) {
    const info = await Strategy.findById(strategy_id);
    return { info };
  }

  async createStrategy(strategy) {
    strategy.minute = `${parseInt(60 * Math.random())}`;
    strategy.hour = `${parseInt(24 * Math.random())}`;

    const doc = new Strategy(strategy);
    // const secret = await encrypt(strategy.secret);  // for testing
    // doc.secret = secret;
    await doc.save();
    const strategyId = doc ? doc._id : '';

    return { _id: strategyId };
  }

  /**
   * Execute buy operations for all strategies
   * @returns {Array} List of results for each strategy execution
   */
  async executeAllBuys() {
    const start = Date.now();
    const now = moment();
    const conditions = {
      status: '1',
      minute: now.get('minute').toString(),
    };
    const strategiesArr = await Strategy.find(conditions);
    logger.info(
      'cur day: %j, hour: %j, minite: %j',
      now.get('day'),
      now.get('hour'),
      now.get('minute'),
    );

    const results = [];

    for (const strategy of strategiesArr) {
      if (strategy.exchange === undefined) {
        logger.info(`[${strategy._id}] - exchange is null , call user!`);
        continue;
      }
      switch (strategy.period * 1) {
      case 1:
        logger.info('按照日购买: %j, cur hour:', strategy.period_value, now.get('hour'));
        if (strategy.period_value.indexOf(now.get('hour').toString()) !== -1) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;
      case 2:
        logger.info('按照周购买: %j, cur hour:', strategy, now.get('hour'));
        if (
          strategy.period_value.indexOf(now.get('day').toString()) !== -1 &&
            strategy.hour === now.get('hour')
        ) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;

      case 3:
        logger.info('按照月购买: %j,cur hour:', strategy, now.get('hour'));
        if (
          strategy.period_value.indexOf(now.get('date').toString()) !== -1 &&
            strategy.hour === now.get('hour')
        ) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;
      default:
        logger.info('未寻到交易周期');
      }
    }
    logger.info('### Round time: %j', Date.now() - start);
    return results;
  }

  /**
   * Execute buy operation for a single strategy
   * @param {string} strategyId - The ID of the strategy
   * @returns {Object} Result of the buy operation
   */
  async executeBuy(strategyId) {
    const strategy = await Strategy.findById(strategyId);
    const result = await this.processBuy(strategy);
    return result;
  }

  /**
   * Execute buy operation for a single strategy
   * @param {Object} strategy - The Information of the strategy
   * @returns {Object} Result of the buy operation
   */
  async processBuy(strategy) {
    // TODO When creating a Strategy, it is necessary to store the encrypted key and secret.
    // const apiKey = await decrypt(strategy.key);
    // const secret = await decrypt(strategy.secret);
    
    const apiKey = strategy.key;
    const { secret } = strategy;

    const exchange = new ccxt[strategy.exchange]({
      apiKey,
      secret,
      timeout: 60000,
    });

    const ticker = await exchange.fetchTicker(strategy.symbol);
    const price = ticker.ask;

    logger.info(`== buy price: ${price}`);
    // TODO: make sure to reach the minimum amount and prize by const markets = await exchange.loadMarkets()[strategy.symbol];

    let amount = 0;
    // Fetch the current price, calculate purchase amount this time by type
    if (strategy.type === STRATEGY_TYPE.NORMAL) {
      amount = (strategy.base_limit / price).toFixed(6);
    } else {
      const fundsToInvest = await this._valueAveraging(strategy, price);
      amount = fundsToInvest.toFixed(6);
      if (amount <= 0) {
        logger.info(`== the purchase amount is too low: ${amount}`);
        // return false;
      }
    }
    logger.info(`== buy amount: ${amount}`);

    const balance = await exchange.fetchBalance();
    const valueTotal = strategy.amount * price;

    // TODO Determine if the balance is sufficient.
    if (balance[strategy.base] < valueTotal) {
      logger.info(`== balance is not enough: ${balance[strategy.base]}`);
      // throw CustomError('');
    }

    const inParams = {};
    if (strategy.exchange === 'okex') {
      inParams.cost = amount;
    }
    // Limit Order type: allows you to specify a desired price. The order will only execute when the market price reaches or exceeds this price.
    // let type = 'limit';

    // Market Order type: executes immediately at the current best market price.
    const type = 'market';
    const side = 'buy';

    // TODO The total price per transaction cannot be less than 5 USDT, and the lowest price cannot be less than 20% of the current price
    // const orderRes = exchange.createOrder(strategy.symbol, type, side, amount, price, inParams);
    const orderRes = await exchange.createOrder('EOS/USDT', 'limit', 'buy', 50, 0.15, inParams);

    logger.info(`== exchange res order id: ${orderRes.id}`);

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
    await orderService.create(inOrder);

    strategy.buy_times = buyTimes;
    strategy.now_buy_times = nowBuyTimes;
    await strategy.save();

    return true;
  }

  // Method to detect sell signal and execute corresponding operation
  async executeSell(strategyId) {
    return true;
  }

  /**
   * Calculate value averaging for a strategy
   * @param {Object} strategy - The strategy object
   * @param {number} price - The current price
   * @returns {number} Calculated funds to be bought
   */
  async _valueAveraging(strategy, price) {
    // The difference between the current value of the target in the account and the expected value is the value to be purchased this time.
    // expectGrowthRate is the expected growth rate. If it's 0.8% (0.008), it means the target's value is expected to grow by 0.8% daily.
    // If there is no expected growth rate, after buying for a period, no further purchase may be needed as the self-growth may have already met the expected value growth.
    // Operate only if the single target investment exceeds 10%, to avoid wasting transaction fees.
    // Vt = C*t*(1 + R)^t
    // Current value = already purchased * current price
    // Expected value = each purchase amount * (1 + R)^number of purchases
    // Amount to be purchased = current value - expected value
    const nowWorth = strategy.quote_total * price;
    const expectWorth =
      strategy.base_limit * (1 + strategy.expect_frowth_rate) ** strategy.buy_times;
    const funds = expectWorth - nowWorth;
    // TODO In theory, value averaging sell strategy means selling the portion that exceeds the expected value, so this should be calculated here and added to the sell strategy.
    // TODO Set the maximum or minimum monthly buy/sell limit, for example, 5 times the preset monthly growth amount, to reduce the fund requirement during significant market fluctuations.
    return funds > 0 ? funds / price : 0;
  }
}

module.exports = new StrategyService();
