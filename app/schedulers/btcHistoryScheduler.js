const cron = require('node-cron');
const HomeService = require('../services/homeService');
const logger = require('../utils/logger');

let isRunning = false;

const btcHistoryScheduler = () => {
  // Run daily at 00:05 UTC to capture the previous day's close
  cron.schedule('5 0 * * *', async () => {
    if (isRunning) {
      logger.info('btcHistoryScheduler: previous execution still running, skipping');
      return;
    }
    isRunning = true;
    try {
      logger.info(`btcHistoryScheduler: running at ${new Date().toISOString()}`);
      await HomeService.fetchAndStoreBtcPrice();
    } catch (error) {
      logger.error(`btcHistoryScheduler: error - ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = btcHistoryScheduler;
