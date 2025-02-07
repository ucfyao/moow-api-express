const ccxt = require('ccxt');
const AipExchangeKeyModel = require('../models/aipExchangeKeyModel');
const { decrypt, encrypt } = require('../utils/cryptoUtils');

class KeyService {
  async getAllKeys(params) {
    const start = Date.now();

    let conditions = {
      // is_deleted: false,
    };

    if (params.showDeleted === true || params.showDeleted === 'true') {
      conditions.is_deleted = true;
    } else {
      conditions.is_deleted = false;
    }

    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 9999;

    const { keyword } = params;
    if (typeof keyword !== 'undefined') {
      conditions = Object.assign(conditions, {
        $or: [{ exchange: new RegExp(keyword, 'i') }, { desc: new RegExp(keyword, 'i') }],
      });
    }

    const query = AipExchangeKeyModel.find(conditions);
    const exchangeKeys = await query
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    const total = await AipExchangeKeyModel.find(conditions).countDocuments();

    exchangeKeys.forEach((exchangeKey) => {
      if (exchangeKey.access_key && exchangeKey.secret_key) {
        const decryptedAccessKey = decrypt(exchangeKey.access_key);
        const decryptedSecretKey = decrypt(exchangeKey.secret_key);
        exchangeKey.access_key = `${decryptedAccessKey.slice(0, 3)}******${decryptedAccessKey.slice(-3)}`;
        exchangeKey.secret_key = `${decryptedSecretKey.slice(0, 3)}******${decryptedSecretKey.slice(-3)}`;
      }
    });
    return {
      list: exchangeKeys,
      pageNumber,
      pageSize,
      total,
    };
  }

  async getKeyById(id) {
    const exchangeKey = await AipExchangeKeyModel.findById(id).lean();
    if (exchangeKey && exchangeKey.access_key && exchangeKey.secret_key) {
      const decryptedaccess_key = decrypt(exchangeKey.access_key);
      const decryptedsecret_key = decrypt(exchangeKey.secret_key);
      exchangeKey.access_key = `${decryptedaccess_key.slice(0, 3)}******${decryptedaccess_key.slice(-3)}`;
      exchangeKey.secret_key = `${decryptedsecret_key.slice(0, 3)}******${decryptedsecret_key.slice(-3)}`;
    }
    return exchangeKey;
  }

  async createKey(keyData) {
    const newExchange = new ccxt[keyData.exchange]({
      apiKey: keyData.access_key,
      secret: keyData.secret_key,
    });
    let validation;
    const response = await newExchange.fetchBalance();
    validation = response.info.balances;
    keyData.secret_show = `${keyData.secret_key.slice(0, 3)}******${keyData.secret_key.slice(-3)}`;

    keyData.access_key = encrypt(keyData.access_key);
    keyData.secret_key = encrypt(keyData.secret_key);
    const exchangeKey = new AipExchangeKeyModel(keyData);
    await exchangeKey.save();
    return { exchangeKey, validation };
  }

  async deleteKey(id) {
    return AipExchangeKeyModel.findByIdAndUpdate(id, {
      is_deleted: true,
      status: AipExchangeKeyModel.KEY_STATUS_SOFT_DELETED,
    });
  }
}

module.exports = new KeyService();
