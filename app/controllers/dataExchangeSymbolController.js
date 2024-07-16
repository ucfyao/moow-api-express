const DataExchangeSymbolService = require('../services/dataExchangeSymbolService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');


// TODO complete symbol controller
class DataExchangeSymbolController {
  /**   
  * Get a specific dataExchangeSymbol
  * @param {Request} req
  * @param {Response} res
  */
  async show(req, res) {
    const conditions = req.body;
    const dataExchangeSymbol = await DataExchangeSymbolService.getADataExchangeSymbol(conditions);
    return ResponseHandler.success(res, dataExchangeSymbol);
  }
  
  /**
  * Create a new dataExchangeSymbol
  * @param {Request} req
  * @param {Response} res
  */
  async create(req, res) {
    const dataExchangeSymbolData = req.body;
    try {
      const dataExchangeSymbol = await DataExchangeSymbolService.createDataExchangeSymbol(dataExchangeSymbolData);
      return ResponseHandler.success(res, dataExchangeSymbol, STATUS_TYPE.created);
    } catch (error) {
      return ResponseHandler.fail(res, { message: 'Create failed', error: error.message });
    }
  }
}
  
module.exports = new DataExchangeSymbolController();