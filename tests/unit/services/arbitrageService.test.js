jest.mock('../../../app/models/arbitrageTickerModel');
jest.mock('../../../app/models/arbitrageConfigModel');
jest.mock('../../../app/models/arbitrageCacheModel');

const ArbitrageTickerModel = require('../../../app/models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../../../app/models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../../../app/models/arbitrageCacheModel');
const ArbitrageService = require('../../../app/services/arbitrageService');

describe('ArbitrageService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('fetchTickers()', () => {
    it('should return tickers within time window', async () => {
      const mockTickers = [
        { exchange: 'binance', symbol: 'BTC/USDT', ticker: { bid: 50000, ask: 50100 } },
      ];
      ArbitrageTickerModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTickers),
      });

      const result = await ArbitrageService.fetchTickers(5);

      expect(result.tickers).toHaveLength(1);
      expect(ArbitrageTickerModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(Object) }),
      );
    });
  });

  describe('queryOpportunities()', () => {
    it('should find arbitrage when diff > minProfit', async () => {
      ArbitrageTickerModel.aggregate.mockResolvedValue([
        {
          _id: 'BTC/USDT',
          tickers: [
            { exchange: 'binance', bid: 50000, ask: 49900 },
            { exchange: 'huobi', bid: 50600, ask: 50500 },
          ],
        },
      ]);

      const result = await ArbitrageService.queryOpportunities(1);

      expect(result.list.length).toBeGreaterThan(0);
      expect(result.list[0].symbol).toBe('BTC/USDT');
      expect(result.list[0].from.exchange).toBe('binance');
      expect(result.list[0].to.exchange).toBe('huobi');
    });

    it('should return empty list when diff < minProfit', async () => {
      ArbitrageTickerModel.aggregate.mockResolvedValue([
        {
          _id: 'BTC/USDT',
          tickers: [
            { exchange: 'binance', bid: 50000, ask: 49999 },
            { exchange: 'huobi', bid: 50001, ask: 50000 },
          ],
        },
      ]);

      const result = await ArbitrageService.queryOpportunities(1);

      expect(result.list).toHaveLength(0);
    });
  });

  describe('getConfig()', () => {
    it('should return user config', async () => {
      const mockConfig = { exchanges: ['binance'], symbols: ['BTC/USDT'] };
      ArbitrageConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockConfig),
      });

      const result = await ArbitrageService.getConfig('user123');

      expect(result.config.exchanges).toEqual(['binance']);
    });

    it('should return empty config if none exists', async () => {
      ArbitrageConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await ArbitrageService.getConfig('user123');

      expect(result.config).toEqual({ exchanges: [], symbols: [] });
    });
  });

  describe('saveConfig()', () => {
    it('should upsert config', async () => {
      const mockConfig = { exchanges: ['binance'], symbols: ['BTC/USDT'] };
      ArbitrageConfigModel.findOneAndUpdate.mockResolvedValue(mockConfig);

      const result = await ArbitrageService.saveConfig('user123', mockConfig);

      expect(ArbitrageConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { user_id: 'user123' },
        mockConfig,
        { upsert: true, new: true },
      );
    });
  });

  describe('getAllExchanges()', () => {
    it('should return ccxt exchanges list', () => {
      const result = ArbitrageService.getAllExchanges();
      expect(result.allExchanges).toBeInstanceOf(Array);
      expect(result.allExchanges.length).toBeGreaterThan(0);
    });
  });

  describe('getAllSymbols()', () => {
    it('should return cached symbols', async () => {
      ArbitrageCacheModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: 'allSymbols', content: ['BTC/USDT'] }),
      });

      const result = await ArbitrageService.getAllSymbols();

      expect(result.allSymbols).toEqual(['BTC/USDT']);
    });

    it('should return empty array if no cache', async () => {
      ArbitrageCacheModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await ArbitrageService.getAllSymbols();

      expect(result.allSymbols).toEqual([]);
    });
  });
});
