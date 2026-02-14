const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

let isRunning = false;

const buyScheduler = () => {
  // Create a scheduled task
  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      logger.info('buyScheduler: previous execution still running, skipping');
      return;
    }
    isRunning = true;
    try {
      logger.info(`Running Task Buy schedule at ${new Date().toLocaleString()}`);
      await StrategyService.executeAllBuys();
    } catch (error) {
      logger.error(`Error running buyScheduler: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });
};

module.exports = buyScheduler;
