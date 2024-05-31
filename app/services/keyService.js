// services/keyService.js
const Key = require('../models/keyModel');
const ccxt = require('ccxt');
const { decrypt,encrypt } = require('../utils/cryptoUtils');

class KeyService {
  async getAllKeys() {
    const keys = await Key.find();
    keys.forEach(keys => {
      if (Key.access_key && Key.secret_key) {
        const decryptedAccessKey = decrypt(Key.access_key);
        const decryptedSecretKey = decrypt(Key.secret_key);
        Key.access_key = `${decryptedAccessKey.slice(0, 3)}******${decryptedAccessKey.slice(-3)}`;
        Key.secret_key = `${decryptedSecretKey.slice(0, 3)}******${decryptedSecretKey.slice(-3)}`;
      }
    });
    return keys;
  }

  async getKeyById(id) {
    const key = await Key.findById(id);
    if (Key.access_key && Key.secret_key) {
      const decryptedaccess_key = decrypt(key.access_key);
      const decryptedsecret_key = decrypt(key.secret_key);
      access_key = `${decryptedaccess_key.slice(0, 3)}******${decryptedaccess_key.slice(-3)}`;
      secret_key = `${decryptedsecret_key.slice(0, 3)}******${decryptedsecret_key.slice(-3)}`
    };
    return key;
  }
  
  async createKey(keyData) {
    if (typeof keyData !== 'object' || keyData === null) {
      throw new Error('Invalid argument: keyData must be an object');
    }
    const newexchange = new ccxt[keyData.exchange]({
      apiKey: keyData.access_key,
      secret: keyData.secret_key,
    });
    let validation;
    const response = await newexchange.fetchBalance();
    validation = response.info.balances;
    keyData.secret_show = `${keyData.secret_key.slice(0, 3)}******${keyData.secret_key.slice(-3)}`;
    keyData.access_key = encrypt(keyData.access_key).content;
    keyData.secret_key = encrypt(keyData.secret_key).content;
    const key = new Key(keyData);
    await key.save()
    return { key, validation };
  }

  async deleteKey(id) {
    return Key.findByIdAndDelete(id);
  }

}

module.exports = new KeyService();