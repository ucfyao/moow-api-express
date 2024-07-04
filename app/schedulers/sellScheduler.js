const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

const sellScheduler = () => {
  cron.schedule('* * * * *', async () => {
    logger.info('Running Task One at midnight every day');
    await StrategyService.executeSell();
  });
};

module.exports = sellScheduler;
