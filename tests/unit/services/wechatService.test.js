jest.mock('axios');
jest.mock('../../../app/services/commonConfigService');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const crypto = require('crypto');
const axios = require('axios');
const CommonConfigService = require('../../../app/services/commonConfigService');
const config = require('../../../config');
const WechatService = require('../../../app/services/wechatService');

// Store original config and restore after tests
const originalWechat = { ...config.wechat };

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();

  // Reset config for each test
  config.wechat = {
    tokenStr: 'test-token',
    appID: 'test-app-id',
    appSecret: 'test-app-secret',
    menu: { button: [] },
  };
});

afterAll(() => {
  config.wechat = originalWechat;
});

describe('WechatService', () => {
  describe('checkToken()', () => {
    it('should return echostr for valid signature', () => {
      const timestamp = '1234567890';
      const nonce = 'test-nonce';
      const echostr = 'echo-string';
      const tokenStr = 'test-token';

      // Compute the expected signature
      const arr = [tokenStr, timestamp, nonce].sort();
      const expectedHash = crypto.createHash('sha1').update(arr.join('')).digest('hex');

      const result = WechatService.checkToken({
        signature: expectedHash,
        timestamp,
        nonce,
        echostr,
      });

      expect(result).toBe(echostr);
    });

    it('should return error string for invalid signature', () => {
      const result = WechatService.checkToken({
        signature: 'invalid-signature',
        timestamp: '1234567890',
        nonce: 'test-nonce',
        echostr: 'echo-string',
      });

      expect(result).toBe('Invalid signature');
    });
  });

  describe('getAccessToken()', () => {
    it('should return cached token if fresh (< 2 hours)', async () => {
      const cachedToken = {
        access_token: 'cached-token-123',
        updated_at: new Date(), // just now
      };
      CommonConfigService.getAccessToken.mockResolvedValue(cachedToken);

      const result = await WechatService.getAccessToken();

      expect(result).toEqual(cachedToken);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should refresh token if stale (> 2 hours)', async () => {
      const staleToken = {
        access_token: 'old-token',
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      };
      CommonConfigService.getAccessToken.mockResolvedValue(staleToken);
      CommonConfigService.setAccessToken.mockResolvedValue(null);

      axios.get.mockResolvedValue({
        data: { access_token: 'new-token-456' },
      });

      const result = await WechatService.getAccessToken();

      expect(result.access_token).toBe('new-token-456');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.weixin.qq.com/cgi-bin/token')
      );
      expect(CommonConfigService.setAccessToken).toHaveBeenCalled();
    });

    it('should refresh token if no cached token exists', async () => {
      CommonConfigService.getAccessToken.mockResolvedValue(null);
      CommonConfigService.setAccessToken.mockResolvedValue(null);

      axios.get.mockResolvedValue({
        data: { access_token: 'fresh-token' },
      });

      const result = await WechatService.getAccessToken();

      expect(result.access_token).toBe('fresh-token');
    });

    it('should return null if config is missing appID/appSecret', async () => {
      config.wechat = { tokenStr: 'test', appID: '', appSecret: '' };
      CommonConfigService.getAccessToken.mockResolvedValue(null);

      const result = await WechatService.getAccessToken();

      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('createMenu()', () => {
    it('should call WeChat API with correct URL and menu data', async () => {
      const menu = { button: [{ type: 'click', name: 'Test' }] };
      axios.post.mockResolvedValue({ data: { errcode: 0, errmsg: 'ok' } });

      const result = await WechatService.createMenu('test-access-token', menu);

      expect(axios.post).toHaveBeenCalledWith(
        'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=test-access-token',
        menu
      );
      expect(result).toEqual({ errcode: 0, errmsg: 'ok' });
    });
  });

  describe('deleteMenu()', () => {
    it('should call WeChat API with correct URL', async () => {
      axios.get.mockResolvedValue({ data: { errcode: 0, errmsg: 'ok' } });

      const result = await WechatService.deleteMenu('test-access-token');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=test-access-token'
      );
      expect(result).toEqual({ errcode: 0, errmsg: 'ok' });
    });
  });
});
