const ccxt = require('ccxt');
const AipStrategyModel = require('../models/aipStrategyModel');
const AipAwaitModel = require('../models/aipAwaitModel');
const { STATUS_TYPE } = require('../utils/statusCodes');
const logger = require('../utils/logger');
const orderService = require('./orderService');
const SymbolService = require('./symbolService');
const AwaitService = require('./awaitService');
const CustomError = require('../utils/customError');

class StrategyService {
  /**
   * Get all strategies meet the criteria
   * @param params - The criteria
   * @returns {list} - Strategies list and page number
   */
  async getAllStrategies(params) {
    const start = Date.now();

    // Do not query strategies with SOFT_DELETED status by default
    let conditions = {
      user: params.userId,
      status: { $lt: AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED },
    };
    const { status } = params;
    if (typeof status !== 'undefined') {
      conditions.status = status;
    }

    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 9999;

    const list = await AipStrategyModel.find(conditions).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();

    // Calculate the profit rate accroding to the exchange symbol for every strategy
    for (let i = 0, len = list.length; i < len; i++) {
      const exSymConditions = {
        exchange: list[i].exchange,
        symbol: list[i].symbol,
      };

      const symbolList = await SymbolService.getAllSymbols(exSymConditions);
      const symbolPrice = symbolList.list[0];
      if (!symbolPrice) {
        list[i].price_native = '-';
        list[i].profit = '-';
        list[i].profit_percentage = '-';
        continue;
      }
      list[i].price_native = parseFloat(symbolPrice.price_native);
      list[i].profit = list[i].quote_total * symbolPrice.price_native - list[i].base_total;
      list[i].profit_percentage = parseInt(list[i].base_total, 10) !== 0 ? list[i].profit / list[i].base_total * 100 : 0;
    }
  
    const total = await AipStrategyModel.countDocuments(conditions);
    logger.info(`\nQuery List\n  Params: \t${JSON.stringify(params)}\n  Return Amount: \t${list.length}\n  Response Time: \t${Date.now() - start} ms\n`);

    return {
      list,
      pageNumber,
      pageSize,
      total,
    };
  }

  /**
   * Get detailed info of a specific strategy
   * @param {string} id- The strategy id
   * @returns {list} - Strategy detailed info list and symbol price
   */
  async getStrategyById(id) {
    const start = Date.now();
    const info = await AipStrategyModel.findById(id);

    const exSymConditions = {
      exchange: info.exchange,
      symbol: info.symbol,
    };

    const symbolList = await SymbolService.getAllSymbols(exSymConditions);
    let symbolPrice = symbolList.list[0];
    if(symbolPrice) {
      symbolPrice.total_price = info.quote_total * symbolPrice.price_usd;
    } else {
      symbolPrice = {};
    }
    logger.info(`\nQuery Details\n  Strategy Id: \t${id}\n  Info Details: \t${info}\n   Response Time: \t${Date.now() - start} ms\n`);

    return { info, symbolPrice };
  }

  /**
   * Create a new strategy
   * @param strategy - The strategy info
   * @returns {list} - Strategy detailed info list and symbol price
   */
  async createStrategy(strategy) {
    const start = Date.now();
    const processedStrategy = { ...strategy, minute:`${parseInt(60 * Math.random(),10)}`, hour:`${parseInt(24 * Math.random(),10)}`};

    const doc = new AipStrategyModel(processedStrategy);
    await doc.save();
    const strategyId = doc ? doc._id : '';

    logger.info(`\nNew Strategy\n  Strategy Id: \t${JSON.stringify(strategyId)}\n  Strategy Info: \t${JSON.stringify(processedStrategy)}\n  Response Time: \t${Date.now() - start} ms\n`);

    return { _id: strategyId };
  }

  /**
   * Partially update the strategy
   * @param params - The strategy data needs to be updated
   * @returns id - Strategies _id
   */
  async partiallyUpdateStrategy(params){
    const start = Date.now();
    const doc = await AipStrategyModel.findById(params._id);

    if (!doc) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND);
    }
    // TODO test with portal user module
    // if (doc.user.toString() !== params.user) {
    //   throw  new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    // }

    if (typeof params.period !== 'undefined') doc.period = params.period;
    if (typeof params.period_value !== 'undefined') doc.period_value = params.period_value;
    if (typeof params.base_limit !== 'undefined') doc.base_limit = params.base_limit;
    if (typeof params.stop_profit_percentage !== 'undefined') doc.stop_profit_percentage = params.stop_profit_percentage;
    if (typeof params.drawdown !== 'undefined') doc.drawdown = params.drawdown;
    
    await doc.save();
    logger.info(`\nUpdate Strategy\n  Strategy Id: \t${JSON.stringify(params._id)}\n  Strategy Info: \t${JSON.stringify(params)}\n  Response Time: \t${Date.now() - start} ms\n`);

    return {
      _id: params._id,
    };
  }

  /**
   * Soft delete the strategy
   * @param strategy - The strategy needs to be soft deleted
   * @returns status - Strategy status
   */
  async deleteStrategy(id){
    const start = Date.now();
    const doc = await AipStrategyModel.findById(id);

    if (!doc) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND);
    }

    const conditions = {
      strategy_id: doc._id,
      user: doc.user,
      sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
      await_status: AipAwaitModel.STATUS_WAITING,
    };
    await AwaitService.createAwait(conditions);

    // soft delete, update the status
    doc.status = AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED;
    await doc.save();
    logger.info(`\nDelete Strategy\n  Strategy Id: \t${id}\n  Response Time: \t${Date.now() - start} ms\n`);
  
    return {
      status: doc.status,
    };
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
    const strategiesArr = await AipStrategyModel.find(conditions);
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
        logger.info('Daily purchase: %j, cur hour:', strategy.period_value, now.get('hour'));
        if (strategy.period_value.indexOf(now.get('hour').toString()) !== -1) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;
      case 2:
        logger.info('Weekly purchase: %j, cur hour:', strategy.period_value, now.get('hour'));
        if (
          strategy.period_value.indexOf(now.get('day').toString()) !== -1 &&
            strategy.hour === now.get('hour').toString()
        ) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;

      case 3:
        logger.info('Monthly purchase: %j,cur hour:', strategy.period_value, now.get('hour'));
        if (
          strategy.period_value.indexOf(now.get('date').toString()) !== -1 &&
            strategy.hour === now.get('hour').toString()
        ) {
          const result = await this.executeBuy(strategy);
          results.push(result);
        }
        break;
      default:
        logger.info('Trading period not found');
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
    const strategy = await AipStrategyModel.findById(strategyId);
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
    if (strategy.type === AipStrategyModel.INVESTMENT_TYPE_REGULAR) {
      amount = (strategy.base_limit / price).toFixed(6);
    } else {
      amount = (await this._valueAveraging(strategy, price)).toFixed(6);
    }

    if (amount <= 0) {
      logger.info(`== the purchase amount is too low: ${amount}`);
      throw new CustomError(STATUS_TYPE.AIP_INSUFFICIENT_PURCHASE_AMOUNT);
    }

    logger.info(`== buy amount: ${amount}`);

    const balance = await exchange.fetchBalance();
    const valueTotal = amount * price;

    // TODO Determine if the balance is sufficient.
    if (balance[strategy.base].free < valueTotal) {
      logger.info(`== balance is not enough: ${balance[strategy.base].free}`);
      throw new CustomError(STATUS_TYPE.AIP_INSUFFICIENT_BALANCE);
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
