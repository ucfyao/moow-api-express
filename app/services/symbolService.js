const DataExchangeSymbolModel = require('../models/dataExchangeSymbolModel');
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

    const query = DataExchangeSymbolModel.find(conditions);
    const symbolList = await query.collation({ locale: 'zh', numericOrdering: true }).sort({ percent: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();
    const total = await DataExchangeSymbolModel.find(conditions).count();

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
    const info = await DataExchangeSymbolModel.findById(id);

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

    const newDataExchangeSymbol = await new DataExchangeSymbolModel(processedSymbol).save();
    return { newDataExchangeSymbol };
  }

  async getPrice() {
    const url = 'https://api.binance.com/api/v3/klines';
    const SYMBOL = 'BTCUSDT';
    const EXCHANGE = 'binance';

    try {
      const responseUSD = await axios.get(url, {
        params: {
          symbol: SYMBOL,
          interval: '1d',
          limit: 1 
        }
      });

      const dataUSD = responseUSD.data[0];
      const price_usd = parseFloat(dataUSD[4]); 
      const volume_usd = parseFloat(dataUSD[5]);

      const usdToCnyRate = await this.getUsdToCnyRate();
      const price_cny = price_usd * usdToCnyRate;
      const volume_cny = volume_usd * usdToCnyRate;

      const newSymbolData = new DataExchangeSymbolModel({
        key: `${EXCHANGE}_${SYMBOL}`,
        exchange: EXCHANGE,
        symbol: 'BTC',
        price_usd: price_usd.toString(),
        price_cny: price_cny.toString(),
        price_btc: '', // This will remain empty as we are not converting to BTC in this example
        price_native: price_usd.toString(), // Assuming USD is the native price here
        vol_usd: volume_usd.toString(),
        vol_cny: volume_cny.toString(),
        vol_btc: '', // This will remain empty as we are not converting to BTC in this example
        vol_native: volume_usd.toString(), // Assuming USD is the native volume here
        trade_vol: (volume_usd / price_usd).toString(), // Volume in terms of amount of BTC
        percent: '',
        base: 'USD',
        quote: 'BTC',
        exchange_url: 'https://www.binance.com/en/trade/BTC_USDT',
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

  async getUsdToCnyRate() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      return response.data.rates.CNY;
    } catch (error) {
      logger.error('Error fetching USD to CNY exchange rate', error);
    }
  }

  async getPriceHist(startDate, endDate) {
    const url = 'https://api.binance.com/api/v3/klines';
    const SYMBOL = 'BTCUSDT';
    const EXCHANGE = 'binance';

    // Convert the dates to Unix timestamps (in milliseconds)
    const startTime = new Date(startDate).setHours(0, 0, 0, 0);
    const endTime = new Date(endDate).setHours(23, 59, 59, 999);

    try {
      const responseUSD = await axios.get(url, {
        params: {
          symbol: SYMBOL,
          interval: '1d',
          startTime: startTime,
          endTime: endTime        
        }
      });

      const prices = responseUSD.data;
      const usdToCnyRate = await this.getUsdToCnyRate();

      for (const dataUSD of prices) {
        const price_usd = parseFloat(dataUSD[4]);
        const volume_usd = parseFloat(dataUSD[5]);
        const price_cny = price_usd * usdToCnyRate;
        const volume_cny = volume_usd * usdToCnyRate;
        const on_time = new Date(dataUSD[0]);

        const newSymbolData = new DataExchangeSymbolModel({
          key: `${EXCHANGE}_${SYMBOL}`,
          exchange: EXCHANGE,
          symbol: 'BTC',
          price_usd: price_usd.toString(),
          price_cny: price_cny.toString(),
          price_btc: '', // This will remain empty as we are not converting to BTC in this example
          price_native: price_usd.toString(), // Assuming USD is the native price here
          vol_usd: volume_usd.toString(),
          vol_cny: volume_cny.toString(),
          vol_btc: '', // This will remain empty as we are not converting to BTC in this example
          vol_native: volume_usd.toString(), // Assuming USD is the native volume here
          trade_vol: (volume_usd / price_usd).toString(), // Volume in terms of amount of BTC
          percent: '',
          base: 'USD',
          quote: 'BTC',
          exchange_url: 'https://www.binance.com/en/trade/BTC_USDT',
          on_time: on_time,
          status: '1',
        });

        await newSymbolData.save();
        logger.info(`Successfully saved Bitcoin data for ${on_time}: ${price_usd} USD, ${price_cny} CNY`);
      }

      return true;
    } catch (error) {
      logger.error('Error fetching Bitcoin data', error);
    }
  }

  async getUsdToCnyRate() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      return response.data.rates.CNY;
    } catch (error) {
      logger.error('Error fetching USD to CNY exchange rate', error);
    }
  }

}

module.exports = new SymbolService();
  
