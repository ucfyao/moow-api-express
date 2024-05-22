// app/controllers/UserMarketController.js
const UserMarketService = require('../services/userMarketService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');

class UserMarketController {

  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
  async getAllUserMarkets(req, res) {
    try {
      const userMarkets = await UserMarketService.getAllUserMarkets();
      ResponseHandler.success(res, userMarkets);
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async getUserMarketById(req, res) {
    try {
      const userMarket = await UserMarketService.getUserMarketById(req.params.id);
      if (userMarket) {
          ResponseHandler.success(res, userMarket);
      } else {
          ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'UserMarket not found');
        }
      } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
    }
  
  async createUserMarket(req, res) {
    try {
      const { name, exchange, accessKey, secretKey, remarks } = req.body;
      const userMarketData = { name, exchange, accessKey, secretKey, remarks };
      console.log(userMarketData); // Debug log
      const userMarket = await UserMarketService.createUserMarket( userMarketData );
      ResponseHandler.success(res, userMarket, STATUS_TYPE.created);
    } catch (error) {
      console.error(error); // Debug log
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

}
module.exports = new UserMarketController();