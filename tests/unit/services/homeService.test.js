jest.mock('../../../app/models/dataBtcHistoryModel');
jest.mock('../../../app/models/commonConfigModel');
jest.mock('../../../app/models/aipOrderModel');
jest.mock('ccxt');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const DataBtcHistoryModel = require('../../../app/models/dataBtcHistoryModel');
const CommonConfigModel = require('../../../app/models/commonConfigModel');
const AipOrderModel = require('../../../app/models/aipOrderModel');
const ccxt = require('ccxt');
const HomeService = require('../../../app/services/homeService');

describe('HomeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBtcHistory()', () => {
    it('should return BTC history list in chronological order', async () => {
      const mockData = [
        { date: '2025-01-02', close: 98000 },
        { date: '2025-01-01', close: 97000 },
      ];

      DataBtcHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([...mockData]),
          }),
        }),
      });

      const result = await HomeService.getBtcHistory({ limit: 30 });

      expect(DataBtcHistoryModel.find).toHaveBeenCalledWith({});
      expect(result.list).toHaveLength(2);
      // Should be reversed to chronological order
      expect(result.list[0].date).toBe('2025-01-01');
      expect(result.list[1].date).toBe('2025-01-02');
    });

    it('should use default limit of 365 when not provided', async () => {
      DataBtcHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await HomeService.getBtcHistory();

      const sortMock = DataBtcHistoryModel.find().sort;
      expect(sortMock).toHaveBeenCalledWith({ date: -1 });
      const limitMock = sortMock().limit;
      expect(limitMock).toHaveBeenCalledWith(365);
    });

    it('should return empty list when no data exists', async () => {
      DataBtcHistoryModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await HomeService.getBtcHistory();

      expect(result.list).toHaveLength(0);
    });
  });

  describe('getDingtouOrders()', () => {
    it('should return orders for configured dingtou_id', async () => {
      CommonConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: 'dingtou_id', content: 'strat-123' }),
      });

      const mockOrders = [
        { _id: 'order-1', strategy_id: 'strat-123', side: 'buy' },
        { _id: 'order-2', strategy_id: 'strat-123', side: 'buy' },
      ];

      AipOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockOrders),
        }),
      });

      const result = await HomeService.getDingtouOrders();

      expect(CommonConfigModel.findOne).toHaveBeenCalledWith({ name: 'dingtou_id' });
      expect(AipOrderModel.find).toHaveBeenCalledWith({ strategy_id: 'strat-123' });
      expect(result.list).toHaveLength(2);
    });

    it('should return empty list when dingtou_id config not found', async () => {
      CommonConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await HomeService.getDingtouOrders();

      expect(result.list).toHaveLength(0);
    });

    it('should return empty list when dingtou_id content is falsy', async () => {
      CommonConfigModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: 'dingtou_id', content: null }),
      });

      const result = await HomeService.getDingtouOrders();

      expect(result.list).toHaveLength(0);
    });
  });

  describe('fetchAndStoreBtcPrice()', () => {
    it('should fetch OHLCV data and bulkWrite to DB', async () => {
      const mockOhlcv = [
        [1705276800000, 96000, 98000, 95000, 97000, 12345.67],
        [1705363200000, 97000, 99000, 96500, 98500, 11234.56],
      ];

      const mockExchange = {
        fetchOHLCV: jest.fn().mockResolvedValue(mockOhlcv),
      };

      ccxt.binance = jest.fn().mockImplementation(() => mockExchange);

      DataBtcHistoryModel.bulkWrite = jest.fn().mockResolvedValue({
        upsertedCount: 2,
        modifiedCount: 0,
      });

      const result = await HomeService.fetchAndStoreBtcPrice();

      expect(mockExchange.fetchOHLCV).toHaveBeenCalledWith('BTC/USDT', '1d', expect.any(Number), 2);
      expect(DataBtcHistoryModel.bulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              filter: expect.objectContaining({ date: expect.any(String) }),
              upsert: true,
            }),
          }),
        ])
      );
      expect(result).toBe(2);
    });

    it('should return 0 when exchange returns no data', async () => {
      const mockExchange = {
        fetchOHLCV: jest.fn().mockResolvedValue([]),
      };

      ccxt.binance = jest.fn().mockImplementation(() => mockExchange);

      const result = await HomeService.fetchAndStoreBtcPrice();

      expect(result).toBe(0);
      expect(DataBtcHistoryModel.bulkWrite).not.toHaveBeenCalled();
    });

    it('should return 0 when exchange returns null', async () => {
      const mockExchange = {
        fetchOHLCV: jest.fn().mockResolvedValue(null),
      };

      ccxt.binance = jest.fn().mockImplementation(() => mockExchange);

      const result = await HomeService.fetchAndStoreBtcPrice();

      expect(result).toBe(0);
    });
  });
});
