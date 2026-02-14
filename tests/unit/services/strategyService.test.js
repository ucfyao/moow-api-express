jest.mock('ccxt');
jest.mock('../../../app/models/aipStrategyModel');
jest.mock('../../../app/models/aipAwaitModel');
jest.mock('../../../app/models/dataExchangeSymbolModel');
jest.mock('../../../app/services/orderService');
jest.mock('../../../app/services/symbolService');
jest.mock('../../../app/services/awaitService');
jest.mock('../../../app/utils/cryptoUtils');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const ccxt = require('ccxt');
const AipStrategyModel = require('../../../app/models/aipStrategyModel');
const AipAwaitModel = require('../../../app/models/aipAwaitModel');
const DataExchangeSymbolModel = require('../../../app/models/dataExchangeSymbolModel');
const OrderService = require('../../../app/services/orderService');
const SymbolService = require('../../../app/services/symbolService');
const AwaitService = require('../../../app/services/awaitService');
const { encrypt, decrypt } = require('../../../app/utils/cryptoUtils');
const StrategyService = require('../../../app/services/strategyService');
const { createMockExchange, setupCcxtMock } = require('../../helpers/mockCcxt');

// Set model static constants
AipStrategyModel.STRATEGY_STATUS_NORMAL = 1;
AipStrategyModel.STRATEGY_STATUS_CLOSED = 2;
AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED = 3;
AipStrategyModel.PERIOD_DAILY = 1;
AipStrategyModel.PERIOD_WEEKLY = 2;
AipStrategyModel.PERIOD_MONTHLY = 3;
AipStrategyModel.INVESTMENT_TYPE_REGULAR = 1;
AipStrategyModel.INVESTMENT_TYPE_INTELLIGENT = 2;
AipStrategyModel.DRAWDOWN_STATUS_ENABLED = 'Y';
AipStrategyModel.DRAWDOWN_STATUS_DISABLED = 'N';

AipAwaitModel.STATUS_WAITING = 1;
AipAwaitModel.STATUS_COMPLETED = 2;
AipAwaitModel.STATUS_PROCESSING = 3;
AipAwaitModel.SELL_TYPE_AUTO_SELL = 1;
AipAwaitModel.SELL_TYPE_DEL_INVEST = 2;

describe('StrategyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: encrypt prefixes with 'enc_', decrypt strips it
    encrypt.mockImplementation((val) => `enc_${val}`);
    decrypt.mockImplementation((val) => val.replace(/^enc_/, ''));
  });

  describe('createStrategy()', () => {
    it('should create strategy with random hour and minute', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      AipStrategyModel.mockImplementation((data) => ({
        ...data,
        _id: 'new-strategy-id',
        save: mockSave,
      }));

      const strategy = {
        user: 'user-1',
        exchange: 'binance',
        symbol: 'BTC/USDT',
        base_limit: 100,
        period: '1',
        period_value: [1],
        type: 1,
      };

      const result = await StrategyService.createStrategy(strategy);

      expect(result._id).toBe('new-strategy-id');
      expect(mockSave).toHaveBeenCalled();

      // Verify the strategy passed to AipStrategyModel has hour and minute
      const constructorCall = AipStrategyModel.mock.calls[0][0];
      expect(constructorCall).toHaveProperty('hour');
      expect(constructorCall).toHaveProperty('minute');
      const hour = parseInt(constructorCall.hour, 10);
      const minute = parseInt(constructorCall.minute, 10);
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThan(24);
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThan(60);
    });

    it('should encrypt key and secret before saving', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      AipStrategyModel.mockImplementation((data) => ({
        ...data,
        _id: 'new-strategy-id',
        save: mockSave,
      }));

      const strategy = {
        user: 'user-1',
        exchange: 'binance',
        key: 'my-api-key',
        secret: 'my-api-secret',
        symbol: 'BTC/USDT',
        base_limit: 100,
        period: '1',
        period_value: [1],
        type: 1,
      };

      await StrategyService.createStrategy(strategy);

      expect(encrypt).toHaveBeenCalledWith('my-api-key');
      expect(encrypt).toHaveBeenCalledWith('my-api-secret');

      // Verify encrypted values are passed to the model
      const constructorCall = AipStrategyModel.mock.calls[0][0];
      expect(constructorCall.key).toBe('enc_my-api-key');
      expect(constructorCall.secret).toBe('enc_my-api-secret');
    });
  });

  describe('getAllStrategies()', () => {
    it('should return paginated strategies with profit calculation', async () => {
      const mockStrategies = [
        {
          _id: 'strat-1',
          exchange: 'binance',
          symbol: 'BTC/USDT',
          quote_total: 0.1,
          base_total: 5000,
        },
      ];

      AipStrategyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockStrategies),
            }),
          }),
        }),
      });
      AipStrategyModel.countDocuments.mockResolvedValue(1);

      DataExchangeSymbolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([{ exchange: 'binance', symbol: 'BTC/USDT', price_native: 52000 }]),
        }),
      });

      const result = await StrategyService.getAllStrategies({
        userId: 'user-1',
        pageNumber: 1,
        pageSize: 10,
      });

      expect(result.list).toHaveLength(1);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(1);
      // Profit = 0.1 * 52000 - 5000 = 200
      expect(result.list[0].profit).toBe(200);
      expect(result.list[0].price_native).toBe(52000);
    });

    it('should handle missing symbol price', async () => {
      const mockStrategies = [
        {
          _id: 'strat-1',
          exchange: 'binance',
          symbol: 'UNKNOWN/USDT',
          quote_total: 0.1,
          base_total: 5000,
        },
      ];

      AipStrategyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockStrategies),
            }),
          }),
        }),
      });
      AipStrategyModel.countDocuments.mockResolvedValue(1);

      DataExchangeSymbolModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await StrategyService.getAllStrategies({ userId: 'user-1' });

      expect(result.list[0].price_native).toBe('-');
      expect(result.list[0].profit).toBe('-');
      expect(result.list[0].profit_percentage).toBe('-');
    });
  });

  describe('partiallyUpdateStrategy()', () => {
    it('should update strategy fields', async () => {
      const mockDoc = {
        _id: 'strat-1',
        user: { toString: () => 'user-1' },
        period: '1',
        base_limit: 100,
        status: 1,
        save: jest.fn().mockResolvedValue(true),
      };
      AipStrategyModel.findById.mockResolvedValue(mockDoc);

      const result = await StrategyService.partiallyUpdateStrategy({
        _id: 'strat-1',
        user: 'user-1',
        base_limit: 200,
        period: '2',
      });

      expect(mockDoc.base_limit).toBe(200);
      expect(mockDoc.period).toBe('2');
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result._id).toBe('strat-1');
    });

    it('should throw when strategy not found', async () => {
      AipStrategyModel.findById.mockResolvedValue(null);

      await expect(
        StrategyService.partiallyUpdateStrategy({ _id: 'nonexistent' })
      ).rejects.toThrow();
    });

    it('should handle status changes (normal/closed)', async () => {
      const mockDoc = {
        _id: 'strat-1',
        user: { toString: () => 'user-1' },
        status: 1,
        save: jest.fn().mockResolvedValue(true),
      };
      AipStrategyModel.findById.mockResolvedValue(mockDoc);

      await StrategyService.partiallyUpdateStrategy({
        _id: 'strat-1',
        user: 'user-1',
        status: '2',
      });

      expect(mockDoc.status).toBe(2);
    });
  });

  describe('deleteStrategy()', () => {
    it('should soft delete strategy and create await order', async () => {
      const mockDoc = {
        _id: 'strat-1',
        user: 'user-1',
        status: 1,
        save: jest.fn().mockResolvedValue(true),
      };
      AipStrategyModel.findById.mockResolvedValue(mockDoc);
      AwaitService.createAwait.mockResolvedValue({});

      const result = await StrategyService.deleteStrategy('strat-1');

      expect(mockDoc.status).toBe(AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(AwaitService.createAwait).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy_id: 'strat-1',
          user: 'user-1',
          sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
          await_status: AipAwaitModel.STATUS_WAITING,
        })
      );
      expect(result.status).toBe(3);
    });

    it('should throw when strategy not found', async () => {
      AipStrategyModel.findById.mockResolvedValue(null);

      await expect(StrategyService.deleteStrategy('nonexistent')).rejects.toThrow();
    });
  });

  describe('processBuy()', () => {
    let mockExchange;

    beforeEach(() => {
      mockExchange = createMockExchange();
      setupCcxtMock(ccxt, mockExchange);
      OrderService.create.mockResolvedValue({ _id: 'order-1' });
      AipStrategyModel.findByIdAndUpdate.mockResolvedValue({});
    });

    it('should decrypt credentials and execute a regular buy order', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        quote: 'BTC',
        base_limit: 100,
        type: AipStrategyModel.INVESTMENT_TYPE_REGULAR,
        buy_times: 5,
        now_buy_times: 3,
        base_total: 500,
        quote_total: 0.01,
        now_base_total: 300,
        now_quote_total: 0.006,
        user_market_id: 'market-1',
        save: jest.fn().mockResolvedValue(true),
      };

      const result = await StrategyService.processBuy(strategy);

      // Verify credentials are decrypted
      expect(decrypt).toHaveBeenCalledWith('enc_api-key');
      expect(decrypt).toHaveBeenCalledWith('enc_api-secret');
      // Verify CCXT is initialized with decrypted credentials
      expect(ccxt.binance).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'api-key',
          secret: 'api-secret',
        })
      );
      expect(mockExchange.fetchTicker).toHaveBeenCalledWith('BTC/USDT');
      expect(mockExchange.loadMarkets).toHaveBeenCalled();
      expect(mockExchange.fetchBalance).toHaveBeenCalled();
      expect(mockExchange.createOrder).toHaveBeenCalledWith(
        'BTC/USDT',
        'market',
        'buy',
        expect.any(String),
        50000,
        {}
      );
      expect(OrderService.create).toHaveBeenCalled();
      expect(AipStrategyModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'strat-1',
        expect.objectContaining({
          $inc: expect.objectContaining({
            buy_times: 1,
            now_buy_times: 1,
          }),
        })
      );
      expect(result).toBe(true);
    });

    it('should throw when order cost is below exchange minimum', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        base_limit: 2, // below minimum cost of 5
        type: AipStrategyModel.INVESTMENT_TYPE_REGULAR,
        buy_times: 0,
        now_buy_times: 0,
        quote_total: 0,
        base_total: 0,
        save: jest.fn(),
      };

      await expect(StrategyService.processBuy(strategy)).rejects.toThrow();
      expect(mockExchange.createOrder).not.toHaveBeenCalled();
    });

    it('should throw when order amount is below exchange minimum', async () => {
      // Set up markets with a high minimum amount
      mockExchange.markets = {
        'BTC/USDT': {
          symbol: 'BTC/USDT',
          limits: {
            amount: { min: 1, max: 9000 }, // min 1 BTC
            cost: { min: 5, max: undefined },
          },
        },
      };

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        base_limit: 100, // 100/50000 = 0.002 BTC, below min 1 BTC
        type: AipStrategyModel.INVESTMENT_TYPE_REGULAR,
        buy_times: 0,
        now_buy_times: 0,
        quote_total: 0,
        base_total: 0,
        save: jest.fn(),
      };

      await expect(StrategyService.processBuy(strategy)).rejects.toThrow();
      expect(mockExchange.createOrder).not.toHaveBeenCalled();
    });

    it('should throw when balance is insufficient', async () => {
      mockExchange.fetchBalance.mockResolvedValue({
        USDT: { free: 1, used: 0, total: 1 },
      });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        base_limit: 100,
        type: AipStrategyModel.INVESTMENT_TYPE_REGULAR,
        buy_times: 0,
        now_buy_times: 0,
        quote_total: 0,
        base_total: 0,
        save: jest.fn(),
      };

      await expect(StrategyService.processBuy(strategy)).rejects.toThrow();
    });

    it('should throw when purchase amount is too low', async () => {
      // Set up amount to be 0 via value averaging returning 0
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        base_limit: 100,
        type: AipStrategyModel.INVESTMENT_TYPE_INTELLIGENT,
        buy_times: 100,
        now_buy_times: 50,
        quote_total: 100, // huge amount already held
        base_total: 5000,
        expect_growth_rate: 0.001,
        save: jest.fn(),
      };

      // With a very high quote_total * price, value averaging could return <= 0
      mockExchange.fetchTicker.mockResolvedValue({
        ask: 50000,
        bid: 49900,
      });

      await expect(StrategyService.processBuy(strategy)).rejects.toThrow();
    });
  });

  describe('processSell()', () => {
    let mockExchange;

    beforeEach(() => {
      mockExchange = createMockExchange();
      setupCcxtMock(ccxt, mockExchange);
    });

    it('should return early when stop_profit_percentage is not set', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 400,
        stop_profit_percentage: null,
      };

      const result = await StrategyService.processSell(strategy);

      expect(result).toBeUndefined();
    });

    it('should return when profit has not reached stop_profit_percentage', async () => {
      mockExchange.fetchTicker.mockResolvedValue({ bid: 50000 });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 500,
        stop_profit_percentage: 50, // need 50% profit
      };

      // Current profit: 0.01 * 50000 - 500 = 0, which is 0% (< 50%)
      const result = await StrategyService.processSell(strategy);

      expect(result).toBeDefined();
      expect(result.strategyId).toBe('strat-1');
    });

    it('should sell when profit reached and no drawdown', async () => {
      mockExchange.fetchTicker.mockResolvedValue({ bid: 100000 });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 500,
        stop_profit_percentage: 10, // profit = 0.01*100000-500 = 500, pct = 100%
        drawdown: null,
        drawdown_status: 'N',
      };

      const result = await StrategyService.processSell(strategy);

      // No drawdown, returns undefined
      expect(result).toBeUndefined();
    });

    it('should sell when drawdown is not enabled (drawdown_status=N)', async () => {
      mockExchange.fetchTicker.mockResolvedValue({ bid: 100000 });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 500,
        stop_profit_percentage: 10,
        drawdown: 5,
        drawdown_status: 'N',
        sell_price: 0,
        user: 'user-1',
      };

      AwaitService.createAwait.mockResolvedValue({
        _id: 'await-1',
        strategy_id: 'strat-1',
      });

      const result = await StrategyService.processSell(strategy);

      expect(AwaitService.createAwait).toHaveBeenCalled();
    });

    it('should trigger drawdown sell when price drops below drawdown threshold', async () => {
      mockExchange.fetchTicker.mockResolvedValue({ bid: 90000 });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 500,
        stop_profit_percentage: 10,
        drawdown: 5,
        drawdown_status: 'Y',
        drawdown_price: 100000, // locked at 100k
        sell_price: 0,
        user: 'user-1',
      };

      // 90000 <= 100000 * (1 - 5/100) = 95000 → true, should trigger sell
      AwaitService.createAwait.mockResolvedValue({
        _id: 'await-1',
        strategy_id: 'strat-1',
      });

      const result = await StrategyService.processSell(strategy);

      expect(AwaitService.createAwait).toHaveBeenCalled();
    });

    it('should reset drawdown_price when price has not dropped below threshold', async () => {
      mockExchange.fetchTicker.mockResolvedValue({ bid: 110000 });

      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        quote_total: 0.01,
        base_total: 500,
        stop_profit_percentage: 10,
        drawdown: 5,
        drawdown_status: 'Y',
        drawdown_price: 100000,
        sell_price: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      // 110000 > 100000 * 0.95 → no sell, reset drawdown_price
      const result = await StrategyService.processSell(strategy);

      expect(strategy.drawdown_price).toBe(110000);
      expect(strategy.save).toHaveBeenCalled();
    });
  });

  describe('executeAllBuys()', () => {
    it('should skip strategies with no exchange', async () => {
      AipStrategyModel.find.mockResolvedValue([
        { _id: 'strat-1', exchange: undefined, period: 1, period_value: [10] },
      ]);

      const results = await StrategyService.executeAllBuys();

      expect(results).toEqual([]);
    });

    it('should execute buy for daily strategy when hour matches', async () => {
      const dayjs = require('dayjs');
      const now = dayjs();
      const currentHour = now.get('hour');

      AipStrategyModel.find.mockResolvedValue([
        {
          _id: 'strat-daily',
          exchange: 'binance',
          period: 1, // daily
          period_value: [currentHour],
          hour: now.get('hour').toString(),
        },
      ]);

      jest.spyOn(StrategyService, 'processBuy').mockResolvedValue({ success: true });

      const results = await StrategyService.executeAllBuys();

      expect(StrategyService.processBuy).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'strat-daily' })
      );
    });
  });

  describe('_valueAveraging()', () => {
    it('should calculate correct funds for value averaging', async () => {
      const strategy = {
        quote_total: 0.01, // currently holds 0.01 BTC
        base_limit: 100, // each purchase $100
        expect_growth_rate: 0.008, // 0.8% growth rate
        buy_times: 5,
      };
      const price = 50000;

      // nowWorth = 0.01 * 50000 = 500
      // expectWorth = 100 * 5 * (1 + 0.008)^5 ≈ 500 * 1.0406 ≈ 520.32
      // funds = 520.32 - 500 = 20.32
      // amount = 20.32 / 50000 ≈ 0.000406
      const result = await StrategyService._valueAveraging(strategy, price);

      expect(result).toBeGreaterThan(0);
    });

    it('should return positive amount when expected > current value', async () => {
      const strategy = {
        quote_total: 0.001, // small holdings
        base_limit: 100,
        expect_growth_rate: 0.008,
        buy_times: 10,
      };
      const price = 50000;

      // nowWorth = 0.001 * 50000 = 50
      // expectWorth = 100 * 10 * (1.008)^10 ≈ 1000 * 1.0829 ≈ 1082.94
      // funds = 1082.94 - 50 = 1032.94
      // amount = 1032.94 / 50000 ≈ 0.02066
      const result = await StrategyService._valueAveraging(strategy, price);

      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 when current value exceeds expected value', async () => {
      const strategy = {
        quote_total: 1.0, // large holdings
        base_limit: 100,
        expect_growth_rate: 0.008,
        buy_times: 2,
      };
      const price = 50000;

      // nowWorth = 1.0 * 50000 = 50000
      // expectWorth = 100 * 2 * (1.008)^2 ≈ 200 * 1.016 ≈ 203.21
      // funds = 203.21 - 50000 < 0 → returns 0
      const result = await StrategyService._valueAveraging(strategy, price);

      expect(result).toBe(0);
    });
  });
});
