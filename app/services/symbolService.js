const DataExchangeSymbol = require('../models/dataExchangeSymbolModel');
const logger = require('../utils/logger');

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
}
  
module.exports = new SymbolService();
  