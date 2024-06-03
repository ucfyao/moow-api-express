const Market = require('../models/marketModel');

class MarketService {
  async getAllMarkets() {
    return Market.find();
  }

  async getMarketById(id) {
    return User.findById(id);
  }

  async createMarket(name, exchange, desc = '', url = '', is_deleted = false) {
    const market = new Market({ name, exchange, desc, url, is_deleted });
    return market.save();
  }

  async updateMarket(id, name, exchange, desc = '', url = '', is_deleted = false) {
    return Market.findByIdAndUpdate(
        id,
        { name, exchange, desc, url, is_deleted },
        { new: true }
      );
  }

  async deleteMarket(id) {
    return Market.findByIdAndDelete(id);
  }
}

module.exports = new MarketService();