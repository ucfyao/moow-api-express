const crypto = require('crypto');
const axios = require('axios');
const CommonConfigService = require('./commonConfigService');
const logger = require('../utils/logger');
const config = require('../../config');

class WechatService {
  /**
   * Validate WeChat server token
   */
  checkToken({ signature, timestamp, nonce, echostr }) {
    const tokenStr = config.wechat?.tokenStr || '';
    const arr = [tokenStr, timestamp, nonce].sort();
    const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
    return hash === signature ? echostr : 'Invalid signature';
  }

  /**
   * Get WeChat API access token (cached, refreshed every 2 hours)
   */
  async getAccessToken() {
    const cached = await CommonConfigService.getAccessToken();
    if (cached && cached.access_token) {
      const age = Date.now() - new Date(cached.updated_at || 0).getTime();
      if (age < 2 * 60 * 60 * 1000) {
        return cached;
      }
    }
    return this._refreshAccessToken();
  }

  async _refreshAccessToken() {
    const appID = config.wechat?.appID;
    const secret = config.wechat?.appSecret;
    if (!appID || !secret) {
      logger.error('[wechat] Missing appID or appSecret in config');
      return null;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${secret}`;
    const res = await axios.get(url);

    if (res.data && res.data.access_token) {
      const tokenData = { access_token: res.data.access_token, updated_at: new Date() };
      await CommonConfigService.setAccessToken(tokenData);
      return tokenData;
    }

    logger.error(`[wechat] Failed to refresh access token: ${JSON.stringify(res.data)}`);
    return null;
  }

  /**
   * Create WeChat custom menu
   */
  async createMenu(accessToken, menu) {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    const res = await axios.post(url, menu);
    return res.data;
  }

  /**
   * Delete WeChat custom menu
   */
  async deleteMenu(accessToken) {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${accessToken}`;
    const res = await axios.get(url);
    return res.data;
  }
}

module.exports = new WechatService();
