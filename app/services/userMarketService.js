// services/usermarketService.js
const UserMarket = require('../models/userMarket');

class UsermarketService {
  async getAllUsermarkets() {
    return UserMarket.find();
  }

  async getUsermarketById(id) {
    return UserMarket.findById(id);
  }

  
  async createUsermarket(usermarketData) {
    if (typeof usermarketData !== 'object' || usermarketData === null) {
      console.error('Service usermarketData:', usermarketData); // Debug log
      throw new Error('Invalid argument: usermarketData must be an object');
    }
    const userMarket = new UserMarket(usermarketData);
    return userMarket.save();
  }

  //async createUserMarket(name, exchange, accessKey, secretKey, remarks ) {
  //  const userMarket = new UserMarket(name, exchange, accessKey, secretKey, remarks );
  //  return userMarket.save();
  //}

}

module.exports = new UsermarketService();