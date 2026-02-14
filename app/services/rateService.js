const ClExchangeRatesModel = require('../models/clExchangeRatesModel');

class RateService {
  async getRmbRateList() {
    const legalCoins = ['cny', 'usd', 'eur', 'hkd', 'jpy', 'krw', 'aud', 'cad', 'rub'];
    const virtualCoins = ['btc', 'eth', 'ltc', 'bch'];

    const rates = await ClExchangeRatesModel.find({
      $or: [{ currency: { $in: legalCoins } }, { currency: { $in: virtualCoins } }],
    }).lean();

    // Sort: virtual coins first, then legal tender
    const virtual = rates.filter((r) => virtualCoins.includes(r.currency));
    const legal = rates.filter((r) => legalCoins.includes(r.currency));

    return { list: [...virtual, ...legal] };
  }
}

module.exports = new RateService();
