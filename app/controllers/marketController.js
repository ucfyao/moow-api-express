// app/controllers/MarketController.js
const MarketService = require('../services/marketService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');
class MarketController {

  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
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
      const { name, exchange, desc, url } = req.body;
      const marketData = { name, exchange, desc, url };
      console.log(marketData); // Debug log
      const market = await MarketService.createMarket( marketData );
      ResponseHandler.success(res, market, STATUS_TYPE.created);
    } catch (error) {
      console.error(error); // Debug log
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

}
module.exports = new MarketController();