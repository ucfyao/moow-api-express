jest.mock('../../../app/models/commonConfigModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const CommonConfigModel = require('../../../app/models/commonConfigModel');
const CommonConfigService = require('../../../app/services/commonConfigService');

describe('CommonConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNextSequenceValue()', () => {
    it('should return incremented sequence value', async () => {
      CommonConfigModel.findOneAndUpdate.mockResolvedValue({
        sequence_value: 10,
      });

      const result = await CommonConfigService.getNextSequenceValue();

      expect(CommonConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'auto_user_id' },
        { $inc: { sequence_value: 1 } },
        { new: true, select: 'sequence_value' }
      );
      expect(result).toBe(10);
    });
  });

  describe('getGiveToken()', () => {
    it('should return token content when found', async () => {
      CommonConfigModel.findOne.mockResolvedValue({ name: 'give_token', content: 5 });

      const result = await CommonConfigService.getGiveToken();

      expect(CommonConfigModel.findOne).toHaveBeenCalledWith({ name: 'give_token' });
      expect(result).toBe(5);
    });

    it('should return undefined when not found', async () => {
      CommonConfigModel.findOne.mockResolvedValue(null);

      const result = await CommonConfigService.getGiveToken();

      expect(result).toBeUndefined();
    });
  });

  describe('getDingTouId()', () => {
    it('should return dingtou id content when found', async () => {
      CommonConfigModel.findOne.mockResolvedValue({ name: 'dingtou_id', content: 'abc-123' });

      const result = await CommonConfigService.getDingTouId();

      expect(CommonConfigModel.findOne).toHaveBeenCalledWith({ name: 'dingtou_id' });
      expect(result).toBe('abc-123');
    });

    it('should return 0 when not found', async () => {
      CommonConfigModel.findOne.mockResolvedValue(null);

      const result = await CommonConfigService.getDingTouId();

      expect(result).toBe(0);
    });
  });

  describe('getAccessToken()', () => {
    it('should return access token when found', async () => {
      CommonConfigModel.findOne.mockResolvedValue({
        name: 'access_token',
        content: 'my-token-123',
      });

      const result = await CommonConfigService.getAccessToken();

      expect(CommonConfigModel.findOne).toHaveBeenCalledWith({ name: 'access_token' });
      expect(result).toBe('my-token-123');
    });

    it('should return null when not found', async () => {
      CommonConfigModel.findOne.mockResolvedValue(null);

      const result = await CommonConfigService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('setAccessToken()', () => {
    it('should update and return the access token document', async () => {
      const updatedDoc = { name: 'access_token', content: 'new-token-456' };
      CommonConfigModel.findOneAndUpdate.mockResolvedValue(updatedDoc);

      const result = await CommonConfigService.setAccessToken('new-token-456');

      expect(CommonConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'access_token' },
        { content: 'new-token-456' },
        { new: true }
      );
      expect(result).toEqual(updatedDoc);
    });
  });
});
