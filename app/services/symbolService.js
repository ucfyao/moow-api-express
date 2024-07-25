const DataExchangeSymbolModel = require('../models/dataExchangeSymbolModel');
const DataExchangeRateModel = require('../models/dataExchangeRateModel');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../../config');
const ccxt = require('ccxt');
const csv = require('csv-parser');
const fs = require('fs');

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

    const newExchangeSymbol = await new DataExchangeSymbolModel(processedSymbol).save();
    return { newExchangeSymbol };
  }

  async getPrice(exchangeId = 'binance', symbol = 'BTC/USDT', startDate, endDate, interval = '1d', limit = 1, otherCurrency = 'CNY') {
    const exchange = new ccxt[exchangeId]();
    const exchangeUrl = exchange.urls.www || exchange.urls.api;
    // Convert dates to timestamps
    const startTimestamp = new Date(`${startDate}T08:00:00Z`).getTime();
    const endTimestamp = new Date(`${endDate}T08:00:00Z`).getTime();

    let allOHLCV = [];
    let currentTimestamp = startTimestamp;

    while (currentTimestamp < endTimestamp) {
        const ohlcv = await exchange.fetchOHLCV(symbol, interval, currentTimestamp, limit);
        // Adjust currentTimestamp for the next day (8 AM)
        currentTimestamp += 24 * 60 * 60 * 1000;
        allOHLCV = allOHLCV.concat(ohlcv);
    }
    // Process the price data
    const newSymbolData = await this.processPriceData(allOHLCV, exchangeId, symbol, otherCurrency, exchangeUrl);
    return allOHLCV;
  }

  async processPriceData(allOHLCV, exchange, symbol, otherCurrency, exchangeUrl){
    const [base, quote] = symbol.split('/');
    
    let usdtRate = 1; 
    if (quote !== 'USDT') {
      const ticker = await exchange.fetchTicker(symbol + '/USDT');
      usdtRate = ticker.last;
    }   

    const usdToOtherRate = await this.getUSDToOtherRate(otherCurrency);
    const records = allOHLCV.map(candle => {
      const [timestamp, open, high, low, close, volume] = candle;
      return {
          key: `${exchange}_${symbol}`,
          exchange: exchange,
          symbol: symbol,
          open: open.toFixed(2).toString(),
          high: high.toFixed(2).toString(),
          low: low.toFixed(2).toString(),
          close: close.toFixed(2).toString(),
          volume: volume.toFixed(2).toString(),
          price_usd: (close * usdtRate).toFixed(2).toString(),
          price_cny: (close * usdtRate * usdToOtherRate).toFixed(2).toString(),
          price_btc: '', // This will remain empty as we are not converting to BTC in this example
          price_native: close.toFixed(2).toString(), // Assuming USD is the native price here
          vol_usd: (volume * usdtRate).toFixed(2).toString(),
          vol_cny: (volume * usdtRate * usdToOtherRate).toFixed(2).toString(),
          vol_btc: '', // This will remain empty as we are not converting to BTC in this example
          vol_native: '', // Assuming USD is the native volume here
          trade_vol: (volume / close).toFixed(4).toString(), // Volume in terms of amount of BTC
          percent: '',
          base: base,
          quote: quote,
          exchange_url: exchangeUrl,
          on_time: new Date(timestamp + 8 * 60 * 60 * 1000),
          status: '1',
      };
    });
    // Use bulkWrite with upsert option
    const bulkOps = records.map(record => ({
    updateOne: {
      filter: { key: record.key, on_time: record.on_time },
      update: { $setOnInsert: record },
      upsert: true
    }
    }));

    await DataExchangeSymbolModel.bulkWrite(bulkOps);
    logger.info(`Successfully inserted ${records.length} records for ${symbol}`);
    return true
  }

  async getUSDToOtherRate(otherCurrency) {
    const { apiUrl } = config.currencyRate;
    try {
      let exchangeRate = await DataExchangeRateModel.findOne({ from_currency: 'USD', to_currency: otherCurrency });
      if (exchangeRate) {
        return exchangeRate.rate;
      } else {
        const response = await axios.get(apiUrl);
        const rate = response.data.rates[otherCurrency];
  
        exchangeRate = new DataExchangeRateModel({
          from_currency: 'USD',
          to_currency: otherCurrency,
          rate: rate
        });
  
        await exchangeRate.save();
        return rate;
      }
    } catch (error) {
      // todo: we need a status code for this
      logger.error('Error fetching USD to CNY exchange rate', error);
    }
  }

  // Function to import CSV data
async loadPriceData(filePath, exchangeId = 'binance', symbol = 'BTC/USDT', otherCurrency = 'CNY') {
  const records = [];
  const exchange = new ccxt[exchangeId]();
  const exchangeUrl = exchange.urls.www || exchange.urls.api;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const [day, month, yearAndTime] = row.candle_time.split('/');
      const [year, time] = yearAndTime.split(' ');
      const timestamp = new Date(`${year}-${month}-${day}T${time}+00:00`).getTime();
      if (row.candle_time && row.open && row.close && row.high && row.low && row.volume) {
        const record = [
          timestamp, // timestamp
          parseFloat(row.open), // open
          parseFloat(row.high), // high
          parseFloat(row.low), // low
          parseFloat(row.close), // close
          parseFloat(row.volume) // volume
        ];
        records.push(record);
      }
    })
    .on('end', async () => {
      const newSymbolData = await this.processPriceData(records, exchangeId, symbol, otherCurrency, exchangeUrl);
    });
  }
}

module.exports = new SymbolService();