const cron = require('node-cron');
const SymbolService = require('../services/symbolService');
const logger = require('../utils/logger');
const { recordStart, recordSuccess, recordFailure } = require('../utils/schedulerRegistry');

const priceScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];

    logger.info(`PriceScheduler for ${startDate}`);
    recordStart('price');
    try {
      await SymbolService.getPrice(startDate, endDate, 'binance', 'BTC/USDT');
      recordSuccess('price');
    } catch (error) {
      recordFailure('price', error);
      logger.error(`Error running PriceScheduler: ${error.message}`);
    }
  });
};

module.exports = priceScheduler;
