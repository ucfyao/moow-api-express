// app/controllers/ExchangeKeyController.js
const AipExchangeKeyService = require('../services/aipexchangeKeyService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');


class ExchangeKeyController {

  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
  async getAllKeys(req, res) {
    const params = {
      //userId: req.user.id,
      pageNumber: parseInt(req.query.pageNumber) || 1,
      pageSize: parseInt(req.query.pageSize) || 9999,
      keyword: req.query.keyword,
    };
    const exchangeKeys = await AipExchangeKeyService.getAllKeys(params);
    return ResponseHandler.success(res, exchangeKeys, STATUS_TYPE.HTTP_OK);
  }

  async getKeyById(req, res) {
    const exchangeKey = await AipExchangeKeyService.getKeyById(req.params.id);
    if (exchangeKey) {
      return ResponseHandler.success(res, exchangeKey);
    }
    return ResponseHandler.fail(res, STATUS_TYPE.HTTP_NOT_FOUND);
  }
  async createKey(req, res) {
    const { exchange, access_key, secret_key, desc } = req.body;
    const keyData = { exchange, access_key, secret_key, desc };

    const { exchangeKey, validation } = await AipExchangeKeyService.createKey(keyData);
    return ResponseHandler.success(res, { exchangeKey, validation }, STATUS_TYPE.HTTP_CREATED);
  }
  async deleteKey(req, res) {
    const result = await AipExchangeKeyService.deleteKey(req.params.id);
    return ResponseHandler.success(res, STATUS_TYPE.HTTP_OK);
  }
}
module.exports = new ExchangeKeyController();