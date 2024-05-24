// services/marketService.js
const Market = require('../models/marketModel');

class MarketService {
  async getAllMarkets() {
    return Market.find();
  }

  async getMarketById(id) {
    return Market.findById(id);
  }

  
  async createMarket(marketData) {
    if (typeof marketData !== 'object' || marketData === null) {
      console.error('Service marketData:', marketData); // Debug log
      throw new Error('Invalid argument: marketData must be an object');
    }
    const market = new Market(marketData);
    return market.save();
  }

  //async createUserMarket(name, exchange, accessKey, secretKey, remarks ) {
  //  const userMarket = new UserMarket(name, exchange, accessKey, secretKey, remarks );
  //  return userMarket.save();
  //}

}

module.exports = new MarketService();