const cron = require('node-cron');
const StrategyService  = require('../services/strategyService.js');

const sellScheduler = () => {
  cron.schedule('* * * * *', async () => {
    console.log('Running Task One at midnight every day');
    await StrategyService.executeSell();
  });
};

module.exports = sellScheduler;