const _ = require('lodash');
const ccxt = require('ccxt');
const ArbitrageTickerModel = require('../models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../models/arbitrageCacheModel');
const logger = require('../utils/logger');

class ArbitrageService {
  /**
   * Get tickers updated within the last N minutes
   * @param {number} minutes - Time window in minutes (default: 5)
   */
  async fetchTickers(minutes = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const tickers = await ArbitrageTickerModel.find({ updated_at: { $gt: cutoff } }).lean();
    return { tickers };
  }

  /**
   * Find arbitrage opportunities where diff > minProfit%
   * Algorithm: For each symbol, find max(bids) and min(asks) across exchanges.
   * diff = (maxBid - minAsk) / minAsk * 100
   */
  async queryOpportunities(minProfit = 1) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const list = await ArbitrageTickerModel.aggregate([
      { $match: { updated_at: { $gt: cutoff } } },
      { $group: { _id: '$symbol', tickers: { $push: '$ticker' } } },
    ]);

    const arbitrageList = [];
    list.forEach((item) => {
      if (!item.tickers || item.tickers.length < 2) return;

      let lowest = item.tickers[0]; // min(asks) — buy from here
      let highest = item.tickers[0]; // max(bids) — sell to here

      for (const t of item.tickers) {
        if (t.ask > 0 && (lowest.ask <= 0 || t.ask < lowest.ask)) {
          lowest = t;
        }
        if (t.bid > 0 && t.bid > highest.bid) {
          highest = t;
        }
      }

      if (lowest.ask <= 0) return;
      const diff = ((highest.bid - lowest.ask) / lowest.ask) * 100;

      if (highest.exchange !== lowest.exchange && diff > minProfit) {
        arbitrageList.push({
          symbol: item._id,
          from: lowest,
          to: highest,
          rawdiff: diff,
          diff: diff.toFixed(2),
        });
      }
    });

    return {
      list: arbitrageList.sort((a, b) => b.rawdiff - a.rawdiff),
    };
  }

  /**
   * Find arbitrage opportunities filtered by specific exchanges and/or symbols
   * @param {number} minProfit - Minimum profit percentage (default: 1)
   * @param {string[]} exchanges - Filter by these exchanges only
   * @param {string[]} symbols - Filter by these symbols only
   */
  async queryCustomOpportunities(minProfit = 1, exchanges = [], symbols = []) {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);

    // Build match conditions
    const matchConditions = { updated_at: { $gt: cutoff } };
    if (exchanges.length > 0) {
      matchConditions.exchange = { $in: exchanges };
    }
    if (symbols.length > 0) {
      matchConditions.symbol = { $in: symbols };
    }

    const list = await ArbitrageTickerModel.aggregate([
      { $match: matchConditions },
      { $group: { _id: '$symbol', tickers: { $push: '$ticker' } } },
    ]);

    const arbitrageList = [];
    list.forEach((item) => {
      if (!item.tickers || item.tickers.length < 2) return;

      let lowest = item.tickers[0];
      let highest = item.tickers[0];

      for (const t of item.tickers) {
        if (t.ask > 0 && (lowest.ask <= 0 || t.ask < lowest.ask)) {
          lowest = t;
        }
        if (t.bid > 0 && t.bid > highest.bid) {
          highest = t;
        }
      }

      if (lowest.ask <= 0) return;
      const diff = ((highest.bid - lowest.ask) / lowest.ask) * 100;

      if (highest.exchange !== lowest.exchange && diff > minProfit) {
        arbitrageList.push({
          symbol: item._id,
          from: lowest,
          to: highest,
          rawdiff: diff,
          diff: diff.toFixed(2),
        });
      }
    });

    return {
      list: arbitrageList.sort((a, b) => b.rawdiff - a.rawdiff),
    };
  }

  /**
   * Group tickers by exchange
   */
  async queryTickersByExchange() {
    const list = await ArbitrageTickerModel.aggregate([
      { $group: { _id: '$exchange', tickers: { $push: '$ticker' } } },
    ]);
    return { list };
  }

  /**
   * Group tickers by symbol
   */
  async queryTickersBySymbol() {
    const list = await ArbitrageTickerModel.aggregate([
      { $group: { _id: '$symbol', tickers: { $push: '$ticker' } } },
    ]);
    return { list };
  }

  /**
   * Get arbitrage config. If userId provided, return user config; otherwise global config (user_id=null).
   */
  async getConfig(userId = null) {
    const config = await ArbitrageConfigModel.findOne({ user_id: userId }).lean();
    return { config: config || { exchanges: [], symbols: [] } };
  }

  /**
   * Save arbitrage config (upsert by user_id)
   */
  async saveConfig(userId = null, { exchanges, symbols }) {
    const config = await ArbitrageConfigModel.findOneAndUpdate(
      { user_id: userId },
      { exchanges, symbols },
      { upsert: true, new: true }
    );
    return { config };
  }

  /**
   * Return all CCXT supported exchange ids
   */
  getAllExchanges() {
    return { allExchanges: ccxt.exchanges };
  }

  /**
   * Get cached symbols from arbitrage_caches
   */
  async getAllSymbols() {
    const cache = await ArbitrageCacheModel.findOne({ name: 'allSymbols' }).lean();
    return { allSymbols: cache ? cache.content : [] };
  }

  /**
   * Refresh symbols by loading markets from all configured exchanges
   */
  async refreshSymbols() {
    const config = await ArbitrageConfigModel.findOne({ user_id: null }).lean();
    if (!config || !config.exchanges || config.exchanges.length === 0) {
      return { allSymbols: [] };
    }

    const allSymbols = [];
    for (const exchangeId of config.exchanges) {
      try {
        const exchange = new ccxt[exchangeId]({ timeout: 10000 });
        await exchange.loadMarkets();
        allSymbols.push(...exchange.symbols);
        logger.info(`[refreshSymbols] ${exchangeId} loaded ${exchange.symbols.length} symbols`);
      } catch (e) {
        logger.error(`[refreshSymbols] ${exchangeId} failed: ${e.message}`);
      }
    }

    const uniqueSymbols = _.uniq(allSymbols);
    await ArbitrageCacheModel.findOneAndUpdate(
      { name: 'allSymbols' },
      { content: uniqueSymbols },
      { upsert: true }
    );

    return { allSymbols: uniqueSymbols };
  }
}

module.exports = new ArbitrageService();
