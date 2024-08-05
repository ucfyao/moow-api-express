const cron = require('node-cron');
const StrategyService = require('../services/strategyService');
const logger = require('../utils/logger');

const sellThirdPartyScheduler = () => {
  cron.schedule('0 18 * * *', async () => {
    logger.info('Running Task One at 6 PM every day."');
    await StrategyService.sellAllOrders();
  });
};
  
module.exports = sellThirdPartyScheduler;