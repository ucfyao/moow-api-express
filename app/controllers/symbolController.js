const SymbolService = require('../services/symbolService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class SymbolController {
  /**
   * Get a list of all symbols by params
   * @param {Request} req
   * @param {Response} res
   */
  async index(req, res) {
    const params = req.body;
    const symbols = await SymbolService.getAllSymbols(params);
    return ResponseHandler.success(res, symbols);
  }

  /**   
  * Get a specific symbol by id
  * @param {Request} req
  * @param {Response} res
  */
  async show(req, res) {
    const symbolId = req.params.id;
    const symbol = await SymbolService.getSymbolById(symbolId);
    return ResponseHandler.success(res, symbol);
  }
  
  // For test
  /**
  * Create a new dataExchangeSymbol
  * @param {Request} req
  * @param {Response} res
  */
  async create(req, res) {
    const symbolData = req.body;
    const symbol = await SymbolService.createSymbol(symbolData);
    return ResponseHandler.success(res, symbol, STATUS_TYPE.created);
  }

  /**
  * Obtain the price of any symbol from any exchang you want
  */
  async getPrice(req, res) {
    const { exchangeId, symbol, startDate, endDate, interval , limit, currency } = req.body
    const symbolData = await SymbolService.getPrice(startDate, endDate, exchangeId, symbol, interval , limit, currency);
    return ResponseHandler.success(res, symbolData, STATUS_TYPE.created);
  }
  /**
  * load price data from csv file
  */
  async loadPrice(req, res) {
    const { path, exchangeId, symbol, currency } = req.body
    const priceData = await SymbolService.loadPriceData(path, exchangeId, symbol, currency);
    return ResponseHandler.success(res, priceData, STATUS_TYPE.created);
  }
}
  
module.exports = new SymbolController();