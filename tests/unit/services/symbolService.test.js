jest.mock('axios');
jest.mock('ccxt');
jest.mock('csv-parser');
jest.mock('fs');
jest.mock('../../../app/models/dataExchangeSymbolModel');
jest.mock('../../../app/models/dataExchangeRateModel');
jest.mock('../../../app/utils/cacheManager', () => ({
  symbolCache: { get: jest.fn(), set: jest.fn() },
  rateCache: { get: jest.fn(), set: jest.fn() },
  priceCache: { get: jest.fn(), set: jest.fn() },
  publicOrderCache: { get: jest.fn(), set: jest.fn() },
}));
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const axios = require('axios');
const DataExchangeSymbolModel = require('../../../app/models/dataExchangeSymbolModel');
const DataExchangeRateModel = require('../../../app/models/dataExchangeRateModel');
const { symbolCache, rateCache } = require('../../../app/utils/cacheManager');
const SymbolService = require('../../../app/services/symbolService');

describe('SymbolService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSymbols()', () => {
    it('should return cached result on cache hit', async () => {
      const cachedResult = {
        list: [{ _id: 's1', symbol: 'BTC/USDT' }],
        pageNumber: 1,
        pageSize: 20,
        total: 1,
      };
      symbolCache.get.mockReturnValue(cachedResult);

      const result = await SymbolService.getAllSymbols({ exchange: 'binance' });

      expect(result).toEqual(cachedResult);
      expect(DataExchangeSymbolModel.find).not.toHaveBeenCalled();
    });

    it('should query database on cache miss and cache the result', async () => {
      symbolCache.get.mockReturnValue(undefined);

      const mockSymbols = [{ _id: 's1', symbol: 'BTC/USDT', exchange: 'binance' }];
      DataExchangeSymbolModel.find.mockReturnValueOnce({
        collation: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockSymbols),
              }),
            }),
          }),
        }),
      });
      DataExchangeSymbolModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(1),
      });

      const result = await SymbolService.getAllSymbols({
        exchange: 'binance',
        pageNumber: 1,
        pageSize: 20,
      });

      expect(result.list).toEqual(mockSymbols);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(1);
      expect(symbolCache.set).toHaveBeenCalled();
    });

    it('should apply keyword search with regex conditions', async () => {
      symbolCache.get.mockReturnValue(undefined);

      DataExchangeSymbolModel.find.mockReturnValueOnce({
        collation: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });
      DataExchangeSymbolModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      await SymbolService.getAllSymbols({ keyword: 'BTC' });

      const firstCallConditions = DataExchangeSymbolModel.find.mock.calls[0][0];
      expect(firstCallConditions).toHaveProperty('$or');
      expect(firstCallConditions.$or).toHaveLength(4);
    });
  });

  describe('getSymbolById()', () => {
    it('should return symbol when found', async () => {
      const mockSymbol = { _id: 's1', symbol: 'BTC/USDT', exchange: 'binance' };
      DataExchangeSymbolModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockSymbol),
      });

      const result = await SymbolService.getSymbolById('s1');

      expect(result).toEqual(mockSymbol);
      expect(DataExchangeSymbolModel.findById).toHaveBeenCalledWith('s1');
    });

    it('should return null when symbol not found', async () => {
      DataExchangeSymbolModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await SymbolService.getSymbolById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createSymbol()', () => {
    it('should create and save a new symbol', async () => {
      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-symbol-id' });
      DataExchangeSymbolModel.mockImplementation(() => ({
        _id: 'new-symbol-id',
        save: mockSave,
      }));

      const result = await SymbolService.createSymbol({
        exchange: 'binance',
        symbol: 'ETH/USDT',
        price_native: '3000',
        base: 'USDT',
        quote: 'ETH',
      });

      expect(mockSave).toHaveBeenCalled();
      expect(result.newExchangeSymbol).toBeDefined();
    });
  });

  describe('getUSDToOtherRate()', () => {
    it('should return cached rate on cache hit', async () => {
      rateCache.get.mockReturnValue(7.25);

      const result = await SymbolService.getUSDToOtherRate('CNY');

      expect(result).toBe(7.25);
      expect(DataExchangeRateModel.findOne).not.toHaveBeenCalled();
    });

    it('should return rate from DB when available', async () => {
      rateCache.get.mockReturnValue(undefined);
      DataExchangeRateModel.findOne.mockResolvedValue({
        from_currency: 'USD',
        to_currency: 'CNY',
        rate: 7.2,
      });

      const result = await SymbolService.getUSDToOtherRate('CNY');

      expect(result).toBe(7.2);
      expect(rateCache.set).toHaveBeenCalledWith('rate:USD:CNY', 7.2);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch from API when not in cache or DB', async () => {
      rateCache.get.mockReturnValue(undefined);
      DataExchangeRateModel.findOne.mockResolvedValue(null);
      axios.get.mockResolvedValue({
        data: { rates: { CNY: 7.3 } },
      });
      const mockSave = jest.fn().mockResolvedValue(true);
      DataExchangeRateModel.mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await SymbolService.getUSDToOtherRate('CNY');

      expect(result).toBe(7.3);
      expect(axios.get).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(rateCache.set).toHaveBeenCalledWith('rate:USD:CNY', 7.3);
    });

    it('should return null on API error', async () => {
      rateCache.get.mockReturnValue(undefined);
      DataExchangeRateModel.findOne.mockResolvedValue(null);
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await SymbolService.getUSDToOtherRate('CNY');

      expect(result).toBeNull();
    });
  });
});
