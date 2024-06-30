const cron = require('node-cron');
const StrategyService  = require('../services/strategyService.js');

const buyScheduler = () => {
  // Create a scheduled task
  cron.schedule('* * * * *', async () => {
    console.log('Running Task Buy schedule at midnight every day', new Date().toLocaleString());
    await StrategyService.executeBuy();
  });
};

module.exports = buyScheduler;