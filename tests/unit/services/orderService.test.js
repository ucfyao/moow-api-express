jest.mock('../../../app/models/aipOrderModel');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const AipOrderModel = require('../../../app/models/aipOrderModel');
const OrderService = require('../../../app/services/orderService');
const CustomError = require('../../../app/utils/customError');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
