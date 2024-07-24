const cron = require('node-cron');
const SymbolService = require('../services/symbolService');
const logger = require('../utils/logger');

const priceScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running Task One at midnight every day');
    await SymbolService.getPrice();
  });
};

module.exports = priceScheduler;
