// services/keyService.js
const Key = require('../models/keyModel');

class KeyService {
  async getAllKeys() {
    return Key.find();
  }

  async getKeyById(id) {
    return Key.findById(id);
  }

  
  async createKey(keyData) {
    if (typeof keyData !== 'object' || keyData === null) {
      throw new Error('Invalid argument: keyData must be an object');
    }
    const key = new Key(keyData);
    return key.save();
  }

  async deleteKey(id) {
    return Key.findByIdAndDelete(id);
  }
  //async createKey(name, exchange, access_key, secret_key, remarks ) {
  //  const key = new Key(name, exchange, access_key, secret_key, remarks );
  //  return key.save();
  //}

}

module.exports = new KeyService();