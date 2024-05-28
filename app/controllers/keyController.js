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
    ResponseHandler.success(res, keys);
  }

  async getKeyById(req, res) {
    const key = await KeyService.getKeyById(req.params.id);
    if (key) {
        ResponseHandler.success(res, key);
    } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Key not found');
      }
    }
  
    async createKey(req, res) {
      const { exchange, access_key, secret_key, desc } = req.body;
      const keyData = { exchange, access_key, secret_key, desc };

      const { key, validation } = await KeyService.createKey(keyData);
      if (validation) {
        ResponseHandler.success(res, { key, validation }, STATUS_TYPE.created);

      } else {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, 'Failed to create key');
      }
    }
  async deleteKey(req, res) {
    const result = await KeyService.deleteKey(req.params.id);
    if (result) {
      ResponseHandler.success(res, { message: 'Key deleted successfully' });
    } else {
      ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Key not found');
    }
  }
}
module.exports = new KeyController();