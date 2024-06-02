// app/controllers/KeyController.js
const KeyService = require('../services/keyService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');
const { validateBinanceKeys } = require('../validators/binanceValidator');
const { decrypt } = require('../utils/cryptoUtils');

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
    try {
      const keys = await KeyService.getAllKeys();
      ResponseHandler.success(res, keys);
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async getKeyById(req, res) {
    try {
      const key = await KeyService.getKeyById(req.params.id);
      if (key) {
          ResponseHandler.success(res, key);
      } else {
          ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Key not found');
        }
      } catch (error) {
        ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
      }
    }

  async createKey(req, res) {
    try {
      const { exchange, access_key, secret_key, desc } = req.body;
      const keyData = { exchange, access_key, secret_key, desc };
      console.log(keyData); // Debug log
      const validation = await validateBinanceKeys(access_key, secret_key);
      if (!validation.valid) {
        return ResponseHandler.fail(res, STATUS_TYPE.badRequest, STATUS_TYPE.paramsError, validation.error);
      }
      const key = await KeyService.createKey( keyData );
      // Partially intercept the returned API key and secret
      const decryptedaccess_key = decrypt(JSON.parse(key.access_key));
      const decryptedsecret_key = decrypt(JSON.parse(key.secret_key));
      key.access_key = `${decryptedaccess_key.slice(0, 3)}******${decryptedaccess_key.slice(-4)}`;
      key.secret_key = `${decryptedsecret_key.slice(0, 3)}******${decryptedsecret_key.slice(-4)}`;

      ResponseHandler.success(res, { key, balances: validation.data }, STATUS_TYPE.created);
    } catch (error) {
      console.error("Controller error:", error); // Debug log
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

  async deleteKey(req, res) {
    try {
      const result = await KeyService.deleteKey(req.params.id);
      if (result) {
        ResponseHandler.success(res, { message: 'Key deleted successfully' });
      } else {
        ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.internalError, 'Key not found');
      }
    } catch (error) {
      ResponseHandler.fail(res, STATUS_TYPE.internalServerError, STATUS_TYPE.internalError, error.message);
    }
  }

}
module.exports = new KeyController();