jest.mock('../../../app/models/clExchangeRatesModel');

const ClExchangeRatesModel = require('../../../app/models/clExchangeRatesModel');
const RateService = require('../../../app/services/rateService');

describe('RateService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getRmbRateList()', () => {
    it('should return virtual coins before legal tender', async () => {
      const mockRates = [
        { currency: 'cny', frate: 7.2 },
        { currency: 'usd', frate: 1 },
        { currency: 'btc', frate: 50000 },
        { currency: 'eth', frate: 3000 },
        { currency: 'eur', frate: 0.92 },
      ];

      ClExchangeRatesModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRates),
      });

      const result = await RateService.getRmbRateList();

      expect(result.list).toHaveLength(5);
      // Virtual coins should come first
      expect(result.list[0].currency).toBe('btc');
      expect(result.list[1].currency).toBe('eth');
      // Legal tender after
      expect(result.list[2].currency).toBe('cny');
      expect(result.list[3].currency).toBe('usd');
      expect(result.list[4].currency).toBe('eur');
    });

    it('should return empty list when no data', async () => {
      ClExchangeRatesModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await RateService.getRmbRateList();

      expect(result.list).toHaveLength(0);
      expect(result.list).toEqual([]);
    });

    it('should query with correct currency filters', async () => {
      ClExchangeRatesModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await RateService.getRmbRateList();

      expect(ClExchangeRatesModel.find).toHaveBeenCalledWith({
        $or: [
          { currency: { $in: ['cny', 'usd', 'eur', 'hkd', 'jpy', 'krw', 'aud', 'cad', 'rub'] } },
          { currency: { $in: ['btc', 'eth', 'ltc', 'bch'] } },
        ],
      });
    });
  });
});
