jest.mock('../../../app/models/aipOrderModel');
jest.mock('../../../app/models/aipStrategyModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const AipOrderModel = require('../../../app/models/aipOrderModel');
const AipStrategyModel = require('../../../app/models/aipStrategyModel');
const OrderService = require('../../../app/services/orderService');
const CustomError = require('../../../app/utils/customError');

AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED = 3;

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderStatistics()', () => {
    it('should return zero stats when user has no strategies', async () => {
      AipStrategyModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await OrderService.getOrderStatistics('user-1');

      expect(result.total_orders).toBe(0);
      expect(result.buy_count).toBe(0);
      expect(result.sell_count).toBe(0);
    });

    it('should return aggregated stats for user strategies', async () => {
      AipStrategyModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: 'strat-1' }, { _id: 'strat-2' }]),
        }),
      });

      AipOrderModel.aggregate.mockResolvedValue([
        {
          _id: null,
          total_orders: 5,
          buy_count: 3,
          sell_count: 2,
          total_buy_cost: 1500,
          total_sell_revenue: 2000,
          total_profit: 500,
        },
      ]);

      const result = await OrderService.getOrderStatistics('user-1');

      expect(result.total_orders).toBe(5);
      expect(result.buy_count).toBe(3);
      expect(result.sell_count).toBe(2);
      expect(result.total_profit).toBe(500);
    });

    it('should return zero stats when strategies have no orders', async () => {
      AipStrategyModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: 'strat-1' }]),
        }),
      });

      AipOrderModel.aggregate.mockResolvedValue([]);

      const result = await OrderService.getOrderStatistics('user-1');

      expect(result.total_orders).toBe(0);
    });
  });

  describe('getOrderById()', () => {
    it('should return order when found', async () => {
      const mockOrder = { _id: 'order-1', strategy_id: 'strat-1', side: 'buy' };
      AipOrderModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await OrderService.getOrderById('order-1');

      expect(AipOrderModel.findById).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw CustomError when order not found', async () => {
      AipOrderModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(OrderService.getOrderById('nonexistent')).rejects.toThrow(CustomError);
    });
  });

  describe('create()', () => {
    it('should create and save a new order', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      AipOrderModel.mockImplementation((data) => ({
        ...data,
        _id: 'new-order-id',
        save: mockSave,
      }));

      const orderData = {
        strategy_id: 'strat-1',
        order_id: 'ext-order-1',
        type: 'market',
        side: 'buy',
        price: '50000',
        amount: '0.002',
        symbol: 'BTC/USDT',
      };

      const result = await OrderService.create(orderData);

      expect(AipOrderModel).toHaveBeenCalledWith(orderData);
      expect(mockSave).toHaveBeenCalled();
      expect(result._id).toBe('new-order-id');
    });
  });

  describe('getAllOrders()', () => {
    it('should return orders for a given strategy', async () => {
      const mockOrders = [
        { _id: 'order-1', strategy_id: 'strat-1', side: 'buy' },
        { _id: 'order-2', strategy_id: 'strat-1', side: 'buy' },
      ];

      AipOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });

      const result = await OrderService.getAllOrders('strat-1');

      expect(AipOrderModel.find).toHaveBeenCalledWith({ strategy_id: 'strat-1' });
      expect(result.list).toHaveLength(2);
    });

    it('should return empty list when no orders found', async () => {
      AipOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await OrderService.getAllOrders('nonexistent-strat');

      expect(result.list).toHaveLength(0);
    });
  });
});
