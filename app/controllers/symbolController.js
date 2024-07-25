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

<<<<<<< HEAD
  async getPriceHist(req, res) {
    const {start, end} = req.body;
    const symbol = await SymbolService.getPriceHist(start, end);
    return ResponseHandler.success(res, symbol, STATUS_TYPE.created);
  }
=======
  /**
  * scheduler to obtain the price of bitcoin on each day
  */
  async getPrice(req, res) {
    const symbolData = await SymbolService.getPrice();
    return ResponseHandler.success(res, symbolData, STATUS_TYPE.created);
  }

>>>>>>> def503d (feat: #610 add schedule to obtain BTC price every day)
}
  
module.exports = new SymbolController();