const cron = require('node-cron');
const ccxt = require('ccxt');
const ArbitrageTickerModel = require('../models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../models/arbitrageConfigModel');
const logger = require('../utils/logger');

const DEFAULT_EXCHANGES = ['binance', 'huobi', 'okx'];
const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT'];
const MAX_ERRORS = 3;

let isRunning = false;

const exchangeInstances = {};
const errorCounts = {};

async function fetchAllTickers() {
  const start = Date.now();

  // Load config (global config where user_id is null)
  const config = await ArbitrageConfigModel.findOne({ user_id: null }).lean();
  const exchanges = config?.exchanges?.length ? config.exchanges : DEFAULT_EXCHANGES;
  const symbols = config?.symbols?.length ? config.symbols : DEFAULT_SYMBOLS;

  for (const exchangeId of exchanges) {
    // Skip exchanges that exceeded error threshold
    if ((errorCounts[exchangeId] || 0) >= MAX_ERRORS) {
      continue;
    }

    // Create or reuse exchange instance
    if (!exchangeInstances[exchangeId] || !exchangeInstances[exchangeId].markets) {
      try {
        exchangeInstances[exchangeId] = new ccxt[exchangeId]({ timeout: 5000 });
        await exchangeInstances[exchangeId].loadMarkets();
        logger.info(`[tickerScheduler] Loaded exchange: ${exchangeId}`);
      } catch (e) {
        logger.error(`[tickerScheduler] Failed to load ${exchangeId}: ${e.message}`);
        errorCounts[exchangeId] = (errorCounts[exchangeId] || 0) + 1;
        continue;
      }
    }

    const exchange = exchangeInstances[exchangeId];

    for (const symbol of symbols) {
      if (!(symbol in exchange.markets)) continue;

      try {
        const ticker = await exchange.fetchTicker(symbol);
        if (!ticker.open) ticker.open = 0;
        Object.assign(ticker, { exchange: exchange.id });

        await ArbitrageTickerModel.findOneAndUpdate(
          { exchange: exchange.id, symbol },
          { ticker },
          { upsert: true },
        );

        // Reset error count on success
        errorCounts[exchangeId] = 0;
      } catch (e) {
        errorCounts[exchangeId] = (errorCounts[exchangeId] || 0) + 1;
        logger.error(`[tickerScheduler] ${exchangeId} ${symbol}: ${e.message}`);

        if (errorCounts[exchangeId] >= MAX_ERRORS) {
          delete exchangeInstances[exchangeId];
          logger.error(`[tickerScheduler] ${exchangeId} exceeded ${MAX_ERRORS} errors, removed`);
          break;
        }
      }
    }
  }

  // Clean old tickers (older than 30 minutes)
  const cleanupCutoff = new Date(Date.now() - 30 * 60 * 1000);
  await ArbitrageTickerModel.deleteMany({ updated_at: { $lt: cleanupCutoff } });

  logger.info(`[tickerScheduler] Round completed in ${Date.now() - start}ms`);
}

const tickerScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (isRunning) {
      logger.info('[tickerScheduler] Previous execution still running, skipping');
      return;
    }
    isRunning = true;
    try {
      logger.info(`[tickerScheduler] Starting ticker fetch at ${new Date().toISOString()}`);
      await fetchAllTickers();
    } catch (error) {
      logger.error(`[tickerScheduler] Error: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = tickerScheduler;
