// app/controllers/ExchangeKeyController.js
const ExchangeKeyService = require('../services/exchangeKeyService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class ExchangeKeyController {
  async index(req, res) {
    const params = req.body;
    const exchangeKeys = await ExchangeKeyService.getAllKeys(params);
    return ResponseHandler.success(res, exchangeKeys, STATUS_TYPE.HTTP_OK);
  }

  async show(req, res) {
    const exchangeKey = await ExchangeKeyService.getKeyById(req.params.id);
    return ResponseHandler.success(res, exchangeKey);
  }

  async create(req, res) {
    const keyData = req.body;
    const { exchangeKey, validation } = await ExchangeKeyService.createKey(keyData);
    return ResponseHandler.success(res, { exchangeKey, validation }, STATUS_TYPE.HTTP_CREATED);
  }

  async update(req, res) {
    const market = await MarketService.updateMarket(req.params.id, req.body);
    return ResponseHandler.success(res, market);
  }

  async destroy(req, res) {
    const result = await ExchangeKeyService.deleteKey(req.params.id);
    return ResponseHandler.success(res, STATUS_TYPE.HTTP_OK);
  }
}
module.exports = new ExchangeKeyController();
