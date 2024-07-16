const DataExchangeSymbol = require('../models/dataExchangeSymbolModel');


// TODO complete symbol services

class DataExchangeSymbolService {
  /**
  * Get exchange symbol info by conditions
  * @param conditions - The conditions including exchange and symbol
  * @returns {number} - The symbol price of this exchange
  */
  async getSymbol(conditions) {
    const symbolPrice = await DataExchangeSymbol.findOne(conditions);
    return symbolPrice;
  }

  /**
  * Create a new symbol
  * @param symbol - The symbol info
  * @returns {number} - Symbol detailed info list
  */
  async createSymbol(symbol) {
    const newDataExchangeSymbol = await new DataExchangeSymbol(symbol).save();
    return { newDataExchangeSymbol };
  }
}
  
module.exports = new DataExchangeSymbolService();
  