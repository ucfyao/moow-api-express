const WechatService = require('../services/wechatService');
const ResponseHandler = require('../utils/responseHandler');
const config = require('../../config');

class WechatController {
  async checkToken(req, res) {
    const result = WechatService.checkToken(req.query);
    return res.send(result);
  }

  async getAccessToken(req, res) {
    const data = await WechatService.getAccessToken();
    return ResponseHandler.success(res, data);
  }

  async createMenu(req, res) {
    const tokenData = await WechatService.getAccessToken();
    if (!tokenData || !tokenData.access_token) {
      return ResponseHandler.fail(res, 500, 1, 'Failed to get access token');
    }
    const menu = config.wechat?.menu || {};
    const data = await WechatService.createMenu(tokenData.access_token, menu);
    return ResponseHandler.success(res, data);
  }

  async deleteMenu(req, res) {
    const tokenData = await WechatService.getAccessToken();
    if (!tokenData || !tokenData.access_token) {
      return ResponseHandler.fail(res, 500, 1, 'Failed to get access token');
    }
    const data = await WechatService.deleteMenu(tokenData.access_token);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new WechatController();
