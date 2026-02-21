const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');
const { recordStart, recordSuccess, recordFailure } = require('../utils/schedulerRegistry');

let isRunning = false;

const sellScheduler = () => {
  cron.schedule('0 6 * * *', async () => {
    if (isRunning) {
      logger.info('sellScheduler: previous execution still running, skipping');
      return;
    }
    isRunning = true;
    recordStart('sell');
    try {
      logger.info('Running Task One at 6 AM every day.');
      await StrategyService.executeAllSells();
      recordSuccess('sell');
    } catch (error) {
      recordFailure('sell', error);
      logger.error(`Error running sellScheduler: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = sellScheduler;
