jest.mock('../../../app/models/commonSequenceCounterModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const CommonSequenceCounterModel = require('../../../app/models/commonSequenceCounterModel');
const SequenceService = require('../../../app/services/sequenceService');

describe('SequenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNextSequenceValue()', () => {
    it('should return incremented sequence value', async () => {
      CommonSequenceCounterModel.findOneAndUpdate.mockResolvedValue({
        sequence_value: 42,
      });

      const result = await SequenceService.getNextSequenceValue('portal_user');

      expect(CommonSequenceCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { sequence_name: 'portal_user' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      expect(result).toBe(42);
    });

    it('should throw when sequence document is null', async () => {
      CommonSequenceCounterModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(SequenceService.getNextSequenceValue('unknown')).rejects.toThrow(
        'Unable to fetch or create the sequence document'
      );
    });
  });
});
