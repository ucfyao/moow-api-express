const DataExchangeSymbol = require('../models/dataExchangeSymbolModel');
const logger = require('../utils/logger');
const axios = require('axios');

class SymbolService {
  /**
  * Query a list of all exchange symbols
  * @param params - The condition params
  * @returns {list} - List of all the symbols and page number
  */
  async getAllSymbols(params) {
    const start = Date.now();

    let conditions = {};

    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 9999;

    const { exchange, symbol, base, quote, keyword } = params;
    // Fuzzy query
    if (typeof exchange !== 'undefined') {
      conditions.exchange = exchange;
    }
    if (typeof symbol !== 'undefined') {
      conditions.symbol = symbol;
    }
    if (typeof base !== 'undefined') {
      conditions.base = base;
    }
    if (typeof quote !== 'undefined') {
      conditions.quote = quote;
    }
    if (typeof keyword !== 'undefined') {
      conditions.$or = [{
        exchange: new RegExp(keyword, 'i'),
      }, {
        symbol: new RegExp(keyword, 'i'),
      }, {
        base: new RegExp(keyword, 'i'),
      }, {
        quote: new RegExp(keyword, 'i'),
      }];
    }

    const query = DataExchangeSymbol.find(conditions);
    const symbolList = await query.collation({ locale: 'zh', numericOrdering: true }).sort({ percent: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();
    const total = await DataExchangeSymbol.find(conditions).count();

    logger.info(`\nQuery List\n  Params: \t${JSON.stringify(params)}\n  Return Amount: \t${symbolList.length}\n  Response Time: \t${Date.now() - start} ms\n`);

    return {
      list: symbolList,
      pageNumber,
      pageSize,
      total,
    };
  }

  /**
  * Query exchange platform information by id
  * @param {string} id - The id of symbol
  * @returns {string} info - The symbol info details
  */
  async getSymbolById(id) {
    const start = Date.now();
    const info = await DataExchangeSymbol.findById(id);

    logger.info(`\nQuery Details\n  Symbol Id: \t${id}\n  Info Details: \t${JSON.stringify(info)}\n    Response Time: \t${Date.now() - start} ms\n`);
    
    return info;
  }

  // For test
  async createSymbol(params) {
    let processedSymbol = {};

    if (params.key !== undefined) processedSymbol.key = params.key;
    if (params.exchange !== undefined) processedSymbol.exchange = params.exchange;
    if (params.symbol !== undefined) processedSymbol.symbol = params.symbol;

    if (params.price_cny !== undefined) processedSymbol.price_cny = params.price_cny;
    if (params.price_usd !== undefined) processedSymbol.price_usd = params.price_usd;
    if (params.price_btc !== undefined) processedSymbol.price_btc = params.price_btc;
    if (params.price_native !== undefined) processedSymbol.price_native = params.price_native;
    
    if (params.vol_cny !== undefined) processedSymbol.vol_cny = params.vol_cny;
    if (params.vol_usd !== undefined) processedSymbol.vol_usd = params.vol_usd;
    if (params.vol_btc !== undefined) processedSymbol.vol_btc = params.vol_btc;
    if (params.vol_native !== undefined) processedSymbol.vol_native = params.vol_native;
    if (params.trade_vol !== undefined) processedSymbol.trade_vol = params.trade_vol;
    if (params.percent !== undefined) processedSymbol.percent = params.percent;
    
    if (params.base !== undefined) processedSymbol.base = params.base;
    if (params.quote !== undefined) processedSymbol.quote = params.quote;
    if (params.exchange_url !== undefined) processedSymbol.exchange_url = params.exchange_url;
    if (params.on_time !== undefined) processedSymbol.on_time = params.on_time;
    if (params.status !== undefined) processedSymbol.status = params.status;

    const newDataExchangeSymbol = await new DataExchangeSymbol(processedSymbol).save();
    return { newDataExchangeSymbol };
  }

  async getPrice() {
    const API_KEY = '926537eb-218a-43a3-b170-726e96cf1e50';
    const url = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';
    const SYMBOL = 'BTC';
    const EXCHANGE = 'coinmarketcap';
    const CURRENCIES = ['USD'];
    try {
      // get bitcoin price
      const responseUSD = await axios.get(url, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY },
        params: { slug: 'bitcoin', convert: 'USD' }
      });

      const dataUSD = responseUSD.data.data['1'];
      const price_usd = dataUSD['quote']['USD']['price'];
      const volume_usd = dataUSD['quote']['USD']['volume_24h'];
      const percent_change_24h = dataUSD['quote']['USD']['percent_change_24h'];

      const responseCNY = await axios.get(url, {
        headers: { 'X-CMC_PRO_API_KEY': API_KEY },
        params: { slug: 'bitcoin', convert: 'CNY' }
      });

      const dataCNY = responseCNY.data.data['1'];
      const price_cny = dataCNY['quote']['CNY']['price'];
      const volume_cny = dataCNY['quote']['CNY']['volume_24h'];

      const newSymbolData = new DataExchangeSymbol({
        key: `${EXCHANGE}_${SYMBOL}`,
        exchange: EXCHANGE,
        symbol: SYMBOL,
        price_usd: price_usd.toString(),
        price_cny: price_cny.toString(),
        price_btc: '', // This will remain empty as we are not converting to BTC in this example
        price_native: price_usd.toString(), // Assuming USD is the native price here
        vol_usd: volume_usd.toString(),
        vol_cny: volume_cny.toString(),
        vol_btc: '', // This will remain empty as we are not converting to BTC in this example
        vol_native: volume_usd.toString(), // Assuming USD is the native volume here
        trade_vol: (volume_usd / price_usd).toString(), // Volume in terms of amount of BTC
        percent: percent_change_24h.toString(),
        base: 'USD',
        quote: SYMBOL,
        exchange_url: 'https://coinmarketcap.com/currencies/bitcoin/',
        on_time: new Date(),
        status: '1',
      });

      await newSymbolData.save();
      logger.info(`Successfully saved Bitcoin data: ${price_usd} USD, ${price_cny} CNY`);
      return newSymbolData
    } catch (error) {
      logger.error('Error fetching Bitcoin data', error);
    }
  }
}

module.exports = new SymbolService();
  
