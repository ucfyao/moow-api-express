const MarketService = require('../services/marketService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class MarketController {
  async getAllMarkets(req, res) {
    try {
        const markets = await MarketService.getAllMarkets();
        ResponseHandler.success(res, markets);
      } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
  }

  async getMarketById(req, res) {
    try {
        const market = await MarketService.getMarketById(req.params.id);
        if (market) {
          ResponseHandler.success(res, market);
        } else {
          ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Market not found');
        }
      } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
  }

  async createMarket(req, res) {
    try {
      const { name, exchange, desc, url, is_deleted } = req.body;
      const market = await MarketService.createMarket(name, exchange, desc, url, is_deleted);
      ResponseHandler.success(res, market, STATUS_TYPE.created);
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async deleteMarket(req, res) {
    try {
      const market = await MarketService.deleteMarket(req.params.id);
      if (market) {
        ResponseHandler.success(res, market);
      } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Market not found');
      }
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }
}
module.exports = new MarketController();