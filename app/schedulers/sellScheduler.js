const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

const sellScheduler = () => {
  cron.schedule('0 6 * * *', async () => {
    logger.info('Running Task One at 6 AM every day.');
    await StrategyService.executeAllSells();
  });
};

module.exports = sellScheduler;
