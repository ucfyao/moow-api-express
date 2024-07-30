const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

const buyScheduler = () => {
  // Create a scheduled task
  cron.schedule('* * * * *', async () => {
    logger.info(`Running Task Buy schedule at midnight every day at ${new Date().toLocaleString()}`);
    await StrategyService.executeAllBuys();
  });
};

module.exports = buyScheduler;
