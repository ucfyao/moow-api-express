const axios = require('axios');
const crypto = require('crypto');

const BINANCE_API_URL = 'https://api.binance.com';

class BinanceAuthService {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async getAccountInfo() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this._generateSignature(queryString);

      const response = await axios.get(`${BINANCE_API_URL}/api/v3/account`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        },
        params: {
          timestamp,
          signature
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error.response ? error.response.data : error.message);
      throw new Error('Could not fetch account info');
    }
  }

  _generateSignature(queryString) {
    return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
  }
}

module.exports = BinanceAuthService;
