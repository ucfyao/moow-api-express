// app/controllers/KeyController.js
const KeyService = require('../services/keyService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../constants/statusCodes');


class KeyController {

  // const getUsers = async (req, res) => {
  //   const users = await userService.getAllUsers();
  //   res.success(res, users, STATUS_TYPE.http.ok, STATUS_TYPE.success);
  // };

  // const createUser = async (req, res) => {
  //   const newUser = await userService.createUser(req.body);
  //   res.success(res, newUser, STATUS_TYPE.http.created, STATUS_TYPE.success);
  // };
  async getAllKeys(req, res) {
    const keys = await KeyService.getAllKeys();
    return ResponseHandler.success(res, keys);
  }

  async getKeyById(req, res) {
    const key = await KeyService.getKeyById(req.params.id);
    return ResponseHandler.success(res, key);
  }
  async createKey(req, res) {
    const { exchange, access_key, secret_key, desc } = req.body;
    const keyData = { exchange, access_key, secret_key, desc };

    const { key, validation } = await KeyService.createKey(keyData);
    return ResponseHandler.success(res, { key, validation }, STATUS_TYPE.created);
  }
  async deleteKey(req, res) {
    const result = await KeyService.deleteKey(req.params.id);
    return ResponseHandler.success(res, { message: 'Key deleted successfully' });
  }
}
module.exports = new KeyController();