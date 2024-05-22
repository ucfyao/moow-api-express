// services/userMarketService.js
const UserMarket = require('../models/userMarket');

class UserMarketService {
  async getAllUserMarkets() {
    return UserMarket.find();
  }

  async getUserMarketById(id) {
    return UserMarket.findById(id);
  }

  
  async createUserMarket(userMarketData) {
    if (typeof userMarketData !== 'object' || userMarketData === null) {
      console.error('Service userMarketData:', userMarketData); // Debug log
      throw new Error('Invalid argument: userMarketData must be an object');
    }
    const userMarket = new UserMarket(userMarketData);
    return userMarket.save();
  }

  //async createUserMarket(name, exchange, accessKey, secretKey, remarks ) {
  //  const userMarket = new UserMarket(name, exchange, accessKey, secretKey, remarks );
  //  return userMarket.save();
  //}

}

module.exports = new UserMarketService();