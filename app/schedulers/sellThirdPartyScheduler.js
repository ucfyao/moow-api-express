const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

let isRunning = false;

const sellThirdPartyScheduler = () => {
  cron.schedule('0 18 * * *', async () => {
    if (isRunning) {
      logger.info('sellThirdPartyScheduler: previous execution still running, skipping');
      return;
    }
    isRunning = true;
    try {
      logger.info('Running Task One at 6 PM every day.');
      await StrategyService.sellAllOrders();
    } catch (error) {
      logger.error(`Error running sellThirdPartyScheduler: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = sellThirdPartyScheduler;
