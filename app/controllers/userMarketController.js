// app/controllers/UserMarketController.js
const UsermarketService = require('../services/usermarketService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');
const BinanceAuthService = require('../services/binanceAuthService');
class UsermarketController {

  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
  async getAllUsermarkets(req, res) {
    try {
      const userMarkets = await UsermarketService.getAllUsermarkets();
      ResponseHandler.success(res, userMarkets);
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async getUsermarketById(req, res) {
    try {
      const userMarket = await UsermarketService.getUsermarketById(req.params.id);
      if (userMarket) {
          ResponseHandler.success(res, userMarket);
      } else {
          ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Usermarket not found');
        }
      } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
    }
  
  async createUsermarket(req, res) {
    try {
      const { exchange, accessKey, secretKey, desc } = req.body;
      const usermarketData = { exchange, accessKey, secretKey, desc };
      console.log(usermarketData); // Debug log
      const userMarket = await UsermarketService.createUsermarket( usermarketData );
      ResponseHandler.success(res, userMarket, STATUS_TYPE.created);
    } catch (error) {
      console.error(error); // Debug log
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async getAccountInfo(req, res) {
    try {
      const { apiKey, apiSecret } = req.body; // 从请求体中获取API Key和Secret Key
      const binanceAuthService = new BinanceAuthService(apiKey, apiSecret);
      const accountInfo = await binanceAuthService.getAccountInfo();
      ResponseHandler.success(res, accountInfo);
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

}
module.exports = new UsermarketController();