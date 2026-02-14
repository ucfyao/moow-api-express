const ccxt = require('ccxt');
const dayjs = require('dayjs');
const AipStrategyModel = require('../models/aipStrategyModel');
const AipAwaitModel = require('../models/aipAwaitModel');
const DataExchangeSymbolModel = require('../models/dataExchangeSymbolModel');
const { STATUS_TYPE } = require('../utils/statusCodes');
const logger = require('../utils/logger');
const OrderService = require('./orderService');
const SymbolService = require('./symbolService');
const AwaitService = require('./awaitService');
const CustomError = require('../utils/customError');
const { encrypt, decrypt } = require('../utils/cryptoUtils');
const config = require('../../config');

class StrategyService {
  /**
   * Get all strategies meet the criteria
   * @param params - The criteria
   * @returns {list} - Strategies list and page number
   */
  async getAllStrategies(params) {
    const start = Date.now();

    // Do not query strategies with SOFT_DELETED status by default
    const conditions = {
      user: params.userId,
      status: { $lt: AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED },
    };
    const { status } = params;
    if (typeof status !== 'undefined') {
      conditions.status = status;
    }

    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 9999;

    const list = await AipStrategyModel.find(conditions)
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // Batch-fetch symbol prices to avoid N+1 queries
    const uniquePairs = [];
    const pairSet = new Set();
    for (const item of list) {
      const key = `${item.exchange}:${item.symbol}`;
      if (!pairSet.has(key)) {
        pairSet.add(key);
        uniquePairs.push({ exchange: item.exchange, symbol: item.symbol });
      }
    }

    const symbolLookup = {};
    if (uniquePairs.length > 0) {
      const symbolDocs = await DataExchangeSymbolModel.find({
        $or: uniquePairs.map((p) => ({ exchange: p.exchange, symbol: p.symbol })),
      })
        .sort({ percent: -1 })
        .lean();
      for (const doc of symbolDocs) {
        const lookupKey = `${doc.exchange}:${doc.symbol}`;
        if (!symbolLookup[lookupKey]) {
          symbolLookup[lookupKey] = doc;
        }
      }
    }

    // Calculate the profit rate for every strategy
    for (let i = 0, len = list.length; i < len; i++) {
      const lookupKey = `${list[i].exchange}:${list[i].symbol}`;
      const symbolPrice = symbolLookup[lookupKey];
      if (!symbolPrice) {
        list[i].price_native = '-';
        list[i].profit = '-';
        list[i].profit_percentage = '-';
        continue;
      }
      list[i].price_native = parseFloat(symbolPrice.price_native);
      list[i].profit = list[i].quote_total * symbolPrice.price_native - list[i].base_total;
      list[i].profit_percentage =
        parseInt(list[i].base_total, 10) !== 0 ? (list[i].profit / list[i].base_total) * 100 : 0;
    }

    const total = await AipStrategyModel.countDocuments(conditions);
    logger.info(
      `\nQuery List\n  Params: \t${JSON.stringify(params)}\n  Return Amount: \t${list.length}\n  Response Time: \t${Date.now() - start} ms\n`,
    );

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
  async getStrategyById(id, userId) {
    const start = Date.now();
    const info = await AipStrategyModel.findById(id);

    if (!info) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Strategy not found');
    }
    if (userId && info.user.toString() !== userId) {
      throw new CustomError(STATUS_TYPE.HTTP_FORBIDDEN, 403, 'Access denied');
    }

    const exSymConditions = {
      exchange: info.exchange,
      symbol: info.symbol,
    };

    const symbolList = await SymbolService.getAllSymbols(exSymConditions);
    let symbolPrice = symbolList.list[0];
    if (symbolPrice) {
      symbolPrice.total_price = info.quote_total * symbolPrice.price_usd;
    } else {
      symbolPrice = {};
    }
    logger.info(
      `\nQuery Details\n  Strategy Id: \t${id}\n  Info Details: \t${info}\n   Response Time: \t${Date.now() - start} ms\n`,
    );

    return { info, symbolPrice };
  }

  /**
   * Create a new strategy
   * @param strategy - The strategy info
   * @returns {list} - Strategy detailed info list and symbol price
   */
  async createStrategy(strategy) {
    const start = Date.now();
    const processedStrategy = {
      ...strategy,
      minute: `${parseInt(60 * Math.random(), 10)}`,
      hour: `${parseInt(24 * Math.random(), 10)}`,
    };

    // Encrypt exchange credentials before storing
    if (processedStrategy.key) {
      processedStrategy.key = encrypt(processedStrategy.key);
    }
    if (processedStrategy.secret) {
      processedStrategy.secret = encrypt(processedStrategy.secret);
    }

    const doc = new AipStrategyModel(processedStrategy);
    await doc.save();
    const strategyId = doc ? doc._id : '';

    logger.info(
      `\nNew Strategy\n  Strategy Id: \t${JSON.stringify(strategyId)}\n  Strategy Info: \t${JSON.stringify(processedStrategy)}\n  Response Time: \t${Date.now() - start} ms\n`,
    );

    return { _id: strategyId };
  }

  /**
   * Partially update the strategy
   * @param params - The strategy data needs to be updated
   * @returns id - Strategies _id
   */
  async partiallyUpdateStrategy(params) {
    const start = Date.now();
    const doc = await AipStrategyModel.findById(params._id);

    if (!doc) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND);
    }
    if (doc.user.toString() !== params.user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    if (typeof params.period !== 'undefined') doc.period = params.period;
    if (typeof params.period_value !== 'undefined') doc.period_value = params.period_value;
    if (typeof params.base_limit !== 'undefined') doc.base_limit = params.base_limit;
    if (typeof params.stop_profit_percentage !== 'undefined')
      doc.stop_profit_percentage = params.stop_profit_percentage;
    if (typeof params.drawdown !== 'undefined') doc.drawdown = params.drawdown;

    // For status switching
    if (typeof params.status !== 'undefined') {
      if (AipStrategyModel.STRATEGY_STATUS_NORMAL === parseInt(params.status, 10)) {
        doc.status = AipStrategyModel.STRATEGY_STATUS_NORMAL;
      } else if (AipStrategyModel.STRATEGY_STATUS_CLOSED === parseInt(params.status, 10)) {
        doc.status = AipStrategyModel.STRATEGY_STATUS_CLOSED;
      }
    }

    await doc.save();
    logger.info(
      `\nUpdate Strategy\n  Strategy Id: \t${JSON.stringify(params._id)}\n  Strategy Info: \t${JSON.stringify(params)}\n  Response Time: \t${Date.now() - start} ms\n`,
    );

    return {
      _id: params._id,
    };
  }

  /**
   * Soft delete the strategy
   * @param strategy - The strategy needs to be soft deleted
   * @returns status - Strategy status
   */
  async deleteStrategy(id, userId) {
    const start = Date.now();
    const doc = await AipStrategyModel.findById(id);

    if (!doc) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND);
    }
    if (userId && doc.user.toString() !== userId) {
      throw new CustomError(STATUS_TYPE.HTTP_FORBIDDEN, 403, 'Access denied');
    }

    const conditions = {
      strategy_id: doc._id,
      user: doc.user,
      sell_type: AipAwaitModel.SELL_TYPE_DEL_INVEST,
      await_status: AipAwaitModel.STATUS_WAITING,
    };
    await AwaitService.createAwait(conditions);

    // soft delete, update the status
    doc.status = AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED;
    await doc.save();
    logger.info(
      `\nDelete Strategy\n  Strategy Id: \t${id}\n  Response Time: \t${Date.now() - start} ms\n`,
    );

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
    const now = dayjs();
    const conditions = {
      status: AipStrategyModel.STRATEGY_STATUS_NORMAL,
      minute: now.get('minute').toString(),
    };
    const strategiesArr = await AipStrategyModel.find(conditions).lean();
    logger.info(
      `cur day: ${now.get('day')}, hour: ${now.get('hour')}, minite: ${now.get('minute')}`,
    );

    const results = [];

    for (const strategy of strategiesArr) {
      try {
        if (strategy.exchange === undefined) {
          logger.info(`[${strategy._id}] - exchange is null , call user!`);
          continue;
        }
        switch (strategy.period * 1) {
          case AipStrategyModel.PERIOD_DAILY:
            logger.info(`Daily purchase: ${strategy.period_value}, cur hour: ${now.get('hour')}`);
            if (strategy.period_value.indexOf(now.get('hour')) !== -1) {
              const result = await this.processBuy(strategy);
              results.push(result);
            }
            break;
          case AipStrategyModel.PERIOD_WEEKLY:
            logger.info(`Weekly purchase: ${strategy.period_value}, cur hour: ${now.get('hour')}`);
            if (
              strategy.period_value.indexOf(now.get('day')) !== -1 &&
              strategy.hour === now.get('hour').toString()
            ) {
              const result = await this.processBuy(strategy);
              results.push(result);
            }
            break;

          case AipStrategyModel.PERIOD_MONTHLY:
            logger.info(`Monthly purchase: ${strategy.period_value},cur hour: ${now.get('hour')}`);
            if (
              strategy.period_value.indexOf(now.get('date')) !== -1 &&
              strategy.hour === now.get('hour').toString()
            ) {
              const result = await this.processBuy(strategy);
              results.push(result);
            }
            break;
          default:
            logger.info('Trading period not found');
        }
      } catch (error) {
        logger.error(`[executeAllBuys] Strategy ${strategy._id} failed: ${error.message}`);
      }
    }
    logger.info(`### Round time: ${Date.now() - start}ms`);
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
    // Decrypt RSA-encrypted exchange credentials
    const apiKey = decrypt(strategy.key);
    const secret = decrypt(strategy.secret);

    const exchange = new ccxt[strategy.exchange]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });

    const ticker = await exchange.fetchTicker(strategy.symbol);
    const price = ticker.ask;

    logger.info(`== buy price: ${price}`);

    // Validate minimum order amount via exchange market info
    await exchange.loadMarkets();
    const market = exchange.markets[strategy.symbol];
    if (market && market.limits) {
      const minCost = market.limits.cost && market.limits.cost.min;
      if (minCost && strategy.base_limit < minCost) {
        logger.info(`== order cost ${strategy.base_limit} is below exchange minimum ${minCost}`);
        throw new CustomError(STATUS_TYPE.AIP_BELOW_MINIMUM_ORDER);
      }
    }

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

    // Validate minimum amount against exchange limits
    if (market && market.limits) {
      const minAmount = market.limits.amount && market.limits.amount.min;
      if (minAmount && amount < minAmount) {
        logger.info(`== order amount ${amount} is below exchange minimum ${minAmount}`);
        throw new CustomError(STATUS_TYPE.AIP_BELOW_MINIMUM_ORDER);
      }
    }

    const orderRes = await exchange.createOrder(
      strategy.symbol,
      type,
      side,
      amount,
      price,
      inParams,
    );

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
    await OrderService.create(inOrder);

    await AipStrategyModel.findByIdAndUpdate(strategy._id, {
      $inc: {
        buy_times: 1,
        now_buy_times: 1,
        base_total: valueTotal,
        quote_total: parseFloat(amount),
        now_base_total: valueTotal,
        now_quote_total: parseFloat(amount),
      },
    });

    return true;
  }

  /**
   * Execute sell operations for all strategies
   * @returns {Array} List of results for each strategy execution
   */
  async executeAllSells() {
    const start = Date.now();
    const conditions = {
      status: AipStrategyModel.STRATEGY_STATUS_NORMAL,
    };
    const results = [];
    const strategiesArr = await AipStrategyModel.find(conditions);
    for (const strategy of strategiesArr) {
      try {
        if (strategy.exchange === undefined) {
          logger.info(`[${strategy._id}] - exchange is null , call user !`);
          continue;
        }
        const result = await this.processSell(strategy);
        results.push(result);
      } catch (error) {
        logger.error(`[executeAllSells] Strategy ${strategy._id} failed: ${error.message}`);
      }
    }
    logger.info(`### Round time: ${Date.now() - start}ms`);
    logger.info(
      "The future has arrived, it just hasn't become mainstream yet. Let us lead you into the world of blockchain ahead of time.",
    );
    return results;
  }

  /**
   * Method to detect sell signal and execute corresponding operation
   * @param {strategyId} - The id of the strategy
   * @returns {Object} Result of the sell operation
   */
  async executeSell(strategyId) {
    const strategy = await AipStrategyModel.findById(strategyId);
    const result = await this.processSell(strategy);
    return result;
  }

  /**
   * Execute sell operation for a single strategy
   * @param {Object} strategy - The Information of the strategy
   * @returns {Object} Result of the sell operation
   */
  async processSell(strategy) {
    // Decrypt RSA-encrypted exchange credentials
    const apiKey = decrypt(strategy.key);
    const secret = decrypt(strategy.secret);

    const exchange = new ccxt[strategy.exchange]({
      apiKey,
      secret,
      timeout: config.exchangeTimeOut,
    });
    const tickerRes = await exchange.fetchTicker(strategy.symbol);
    const sell_price = tickerRes.bid;
    logger.info(`[price] - ${sell_price}`);

    // check whether profit reaches the stop profit
    const profit = strategy.quote_total * sell_price - strategy.base_total;
    const profit_percentage = (profit / strategy.base_total) * 100;

    if (strategy.stop_profit_percentage == null) {
      return;
    }

    // Did not reach the stop profit point, exiting
    if (profit_percentage < strategy.stop_profit_percentage) {
      logger.info(
        `[profit_percentage] - \n Profit Rate: ${profit_percentage}%\n Stop Profit Rate: ${strategy.stop_profit_percentage}%\n Did not reach the stop profit rate, exit`
      );
      return {
        strategyId: strategy._id,
        result: `[profit_percentage] - \n Profit Rate: ${profit_percentage}%\n Stop Profit Rate: ${strategy.stop_profit_percentage}%\n Did not reach the stop profit rate, exit`,
      };
    }
    if (strategy.drawdown == null) {
      return;
    }
    // Reached the stop profit point, peak not set, proceeding to sell.
    if (strategy.drawdown_status === 'N' || strategy.drawdown <= 0) {
      logger.info('[sell] - Reached the stop profit point, selling');
      strategy.sell_price = sell_price;
      return await this.sellout(strategy);
    }

    // Checking for peak drawdown
    if (strategy.drawdown_status === 'Y' && strategy.drawdown > 0) {
      // If a drawdown is set, compare the current price with the last locked price as a percentage
      // Below the previous price, breaching the drawdown, selling off completely
      if (
        strategy.drawdown_price != null &&
        sell_price <= strategy.drawdown_price * (1 - strategy.drawdown / 100)
      ) {
        logger.info('[drawdown] - Triggering drawdown, selling');
        strategy.sell_price = sell_price;
        return await this.sellout(strategy);
      }
      // Price is higher than the previous price, resetting the locked price
      logger.info('[drawdown_price] - Did not trigger peak drawdown, resetting the drawdown price');
      strategy.drawdown_price = sell_price;
      await strategy.save();
      return {
        strategyId: strategy._id,
        result: `Did not trigger peak drawdown, resetting the drawdown price. New drawdown price is ${strategy.drawdown_price}.`,
      };
    }
  }

  async sellout(strategy) {
    const conditions = {
      strategy_id: strategy._id,
      user: strategy.user,
      sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
      await_status: AipAwaitModel.STATUS_WAITING,
    };
    const awaitOrder = await AwaitService.createAwait(conditions);
    const id = awaitOrder ? awaitOrder._id : '';
    const strategyId = awaitOrder ? awaitOrder.strategy_id : '';
    logger.info(`New sell order:\n Sell Order ID: \t${id}\n Strategy ID: \t${strategyId}\n `);
    return awaitOrder;
  }

  /**
   * Execute the sale operation on a third-party platform for all pending orders and add the order information to the order database.
   */
  async sellAllOrders() {
    const start = Date.now();
    const conditions = {
      await_status: AipAwaitModel.STATUS_WAITING,
    };
    const awaitOrders = await AwaitService.index(conditions);
    logger.info(`### Pending await orders: ${awaitOrders.length}`);
    for (const awaitorder of awaitOrders) {
      try {
        const updatedOrder = await AipAwaitModel.findOneAndUpdate(
          { _id: awaitorder._id, await_status: AipAwaitModel.STATUS_WAITING },
          { await_status: AipAwaitModel.STATUS_PROCESSING },
          { new: true },
        );
        if (!updatedOrder) {
          logger.info(`[sellAllOrders] Await order ${awaitorder._id} already processing, skipping`);
          continue;
        }
        const strategy = await AipStrategyModel.findById(awaitorder.strategy_id);
        if (!strategy) {
          logger.error(
            `Strategy not found for await order ${awaitorder._id}, strategy_id: ${awaitorder.strategy_id}`,
          );
          continue;
        }
        await AwaitService.sellOnThirdParty(strategy, updatedOrder);
      } catch (error) {
        logger.error(`[sellAllOrders] Await order ${awaitorder._id} failed: ${error.message}`);
      }
    }

    logger.info(`### Round time: ${Date.now() - start}ms`);
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
      strategy.base_limit *
      strategy.buy_times *
      (1 + strategy.expect_growth_rate) ** strategy.buy_times;
    const funds = expectWorth - nowWorth;
    // TODO In theory, value averaging sell strategy means selling the portion that exceeds the expected value, so this should be calculated here and added to the sell strategy.
    // TODO Set the maximum or minimum monthly buy/sell limit, for example, 5 times the preset monthly growth amount, to reduce the fund requirement during significant market fluctuations.
    return funds > 0 ? funds / price : 0;
  }
}

module.exports = new StrategyService();
