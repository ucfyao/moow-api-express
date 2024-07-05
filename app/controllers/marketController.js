const MarketService = require('../services/marketService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class MarketController {
  async index(req, res) {
    const markets = await MarketService.getAllMarkets();
    return ResponseHandler.success(res, markets);
  }

  async show(req, res) {
    const market = await MarketService.getMarketById(req.params.id);
    return ResponseHandler.success(res, market);
  }

  async create(req, res) {
    const marketData = req.body;
    const market = await MarketService.createMarket(marketData);
    return ResponseHandler.success(res, market, STATUS_TYPE.HTTP_CREATED);
  }

  async update(req, res) {
    const market = await MarketService.updateMarket(req.params.id, req.body);
    return ResponseHandler.success(res, market);
  }

  async destroy(req, res) {
    const market = await MarketService.deleteMarket(req.params.id);
    return ResponseHandler.success(res, market, STATUS_TYPE.HTTP_OK);
  }
}
module.exports = new MarketController();
