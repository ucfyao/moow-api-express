const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://fapi.binance.com';

async function validateBinanceKeys(access_key, secret_key) {
  try {
    const endpoint = '/fapi/v1/exchangeInfo';
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', secret_key).update(queryString).digest('hex');

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'X-MBX-APIKEY': access_key,
      },
      params: {
        timestamp,
        signature,
      },
    });

    if (response.status === 200) {
      const balances = response.data; // Get balance information
      return { valid: true, data: balances };
      //return { valid: true, data: response.data };
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return { valid: false, error: 'Invalid API Key or Secret Key' };
    }
    return { valid: false, error: error.message };
  }
}

module.exports = { validateBinanceKeys };
