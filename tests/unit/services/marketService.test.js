jest.mock('../../../app/models/portalMarketModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const PortalMarketModel = require('../../../app/models/portalMarketModel');
const MarketService = require('../../../app/services/marketService');
const CustomError = require('../../../app/utils/customError');

describe('MarketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMarkets()', () => {
    it('should return paginated list of markets', async () => {
      const mockMarkets = [
        { _id: 'market-1', name: 'Binance', exchange: 'binance' },
        { _id: 'market-2', name: 'OKX', exchange: 'okx' },
      ];

      PortalMarketModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockMarkets),
            }),
          }),
        }),
      });
      // countDocuments is chained on a second find() call
      PortalMarketModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockMarkets),
            }),
          }),
        }),
      });
      PortalMarketModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(2),
      });

      const result = await MarketService.getAllMarkets({ pageNumber: 1, pageSize: 10 });

      expect(result.list).toEqual(mockMarkets);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(2);
    });

    it('should apply keyword search filter', async () => {
      PortalMarketModel.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      PortalMarketModel.find.mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(0),
      });

      await MarketService.getAllMarkets({ keyword: 'binance' });

      // First call should have $or condition with regex
      const firstCallConditions = PortalMarketModel.find.mock.calls[0][0];
      expect(firstCallConditions).toHaveProperty('$or');
      expect(firstCallConditions.$or).toHaveLength(2);
    });
  });

  describe('getMarketById()', () => {
    it('should return market when found', async () => {
      const mockMarket = { _id: 'market-1', name: 'Binance', exchange: 'binance' };
      PortalMarketModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockMarket),
      });

      const result = await MarketService.getMarketById('market-1');

      expect(result).toEqual(mockMarket);
      expect(PortalMarketModel.findById).toHaveBeenCalledWith('market-1');
    });

    it('should throw CustomError when market not found', async () => {
      PortalMarketModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(MarketService.getMarketById('nonexistent')).rejects.toThrow(CustomError);
    });
  });

  describe('createMarket()', () => {
    it('should create and save a new market', async () => {
      const mockSave = jest.fn().mockResolvedValue({ _id: 'new-market-id' });
      PortalMarketModel.mockImplementation(() => ({
        _id: 'new-market-id',
        save: mockSave,
      }));

      const result = await MarketService.createMarket({
        name: 'Binance',
        exchange: 'binance',
        url: 'https://binance.com',
      });

      expect(mockSave).toHaveBeenCalled();
      expect(result._id).toBe('new-market-id');
    });
  });

  describe('updateMarket()', () => {
    it('should update market fields and save', async () => {
      const mockDoc = {
        _id: 'market-1',
        name: 'Old Name',
        exchange: 'old-exchange',
        url: 'https://old.com',
        save: jest.fn().mockResolvedValue(true),
      };
      PortalMarketModel.findById.mockResolvedValue(mockDoc);

      const result = await MarketService.updateMarket('market-1', {
        name: 'New Name',
        exchange: 'new-exchange',
        url: 'https://new.com',
      });

      expect(mockDoc.name).toBe('New Name');
      expect(mockDoc.exchange).toBe('new-exchange');
      expect(mockDoc.url).toBe('https://new.com');
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result._id).toBe('market-1');
    });

    it('should throw CustomError when market not found', async () => {
      PortalMarketModel.findById.mockResolvedValue(null);

      await expect(MarketService.updateMarket('nonexistent', { name: 'Test' })).rejects.toThrow(
        CustomError
      );
    });
  });

  describe('deleteMarket()', () => {
    it('should soft delete market by setting is_deleted to true', async () => {
      const mockDoc = {
        _id: 'market-1',
        is_deleted: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PortalMarketModel.findById.mockResolvedValue(mockDoc);

      const result = await MarketService.deleteMarket('market-1');

      expect(mockDoc.is_deleted).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result._id).toBe('market-1');
    });

    it('should throw CustomError when market not found', async () => {
      PortalMarketModel.findById.mockResolvedValue(null);

      await expect(MarketService.deleteMarket('nonexistent')).rejects.toThrow(CustomError);
    });
  });
});
