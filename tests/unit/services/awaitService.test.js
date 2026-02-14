jest.mock('ccxt');
jest.mock('../../../app/models/aipAwaitModel');
jest.mock('../../../app/models/aipStrategyModel');
jest.mock('../../../app/services/orderService');
jest.mock('../../../app/utils/cryptoUtils');
jest.mock('../../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const ccxt = require('ccxt');
const AipAwaitModel = require('../../../app/models/aipAwaitModel');
const AipStrategyModel = require('../../../app/models/aipStrategyModel');
const OrderService = require('../../../app/services/orderService');
const { decrypt } = require('../../../app/utils/cryptoUtils');
const AwaitService = require('../../../app/services/awaitService');
const { createMockExchange, setupCcxtMock } = require('../../helpers/mockCcxt');

// Set model static constants
AipAwaitModel.STATUS_WAITING = 1;
AipAwaitModel.STATUS_COMPLETED = 2;
AipAwaitModel.STATUS_PROCESSING = 3;
AipAwaitModel.SELL_TYPE_AUTO_SELL = 1;
AipAwaitModel.SELL_TYPE_DEL_INVEST = 2;

AipStrategyModel.STRATEGY_STATUS_NORMAL = 1;
AipStrategyModel.STRATEGY_STATUS_CLOSED = 2;
AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED = 3;

describe('AwaitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decrypt.mockImplementation((val) => val.replace(/^enc_/, ''));
  });

  describe('sellOnThirdParty()', () => {
    let mockExchange;

    beforeEach(() => {
      mockExchange = createMockExchange();
      setupCcxtMock(ccxt, mockExchange);
      OrderService.create.mockResolvedValue({ _id: 'order-1' });
    });

    it('should decrypt credentials and execute sell with correct strategy params', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        quote: 'BTC',
        now_quote_total: 0.5,
        quote_total: 0.5,
        base_total: 20000,
        now_base_total: 20000,
        now_buy_times: 10,
        buy_times: 10,
        sell_times: 0,
        user_market_id: 'market-1',
        save: jest.fn().mockResolvedValue(true),
      };

      const awaitOrder = {
        _id: 'await-1',
        strategy_id: 'strat-1',
        sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
        await_status: AipAwaitModel.STATUS_WAITING,
        save: jest.fn().mockResolvedValue(true),
      };

      await AwaitService.sellOnThirdParty(strategy, awaitOrder);

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
      // Verify createOrder uses strategy params
      expect(mockExchange.createOrder).toHaveBeenCalledWith('BTC/USDT', 'market', 'sell', 0.5);
      expect(mockExchange.fetchOrder).toHaveBeenCalledWith('mock-order-123', 'BTC/USDT');
      expect(OrderService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy_id: 'strat-1',
          symbol: 'BTC/USDT',
          side: 'sell',
          type: 'market',
        })
      );
      expect(awaitOrder.await_status).toBe(AipAwaitModel.STATUS_COMPLETED);
      expect(awaitOrder.save).toHaveBeenCalled();
      expect(strategy.save).toHaveBeenCalled();
    });

    it('should return early when exchange is undefined', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: undefined,
      };
      const awaitOrder = { save: jest.fn() };

      await AwaitService.sellOnThirdParty(strategy, awaitOrder);

      expect(decrypt).not.toHaveBeenCalled();
      expect(mockExchange.createOrder).not.toHaveBeenCalled();
      expect(awaitOrder.save).not.toHaveBeenCalled();
    });

    it('should close strategy when auto_create is not Y', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        now_quote_total: 0.5,
        quote_total: 0.5,
        base_total: 20000,
        now_base_total: 20000,
        now_buy_times: 10,
        buy_times: 10,
        sell_times: 0,
        user_market_id: 'market-1',
        auto_create: 'N',
        save: jest.fn().mockResolvedValue(true),
      };

      const awaitOrder = {
        sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
        await_status: AipAwaitModel.STATUS_WAITING,
        save: jest.fn().mockResolvedValue(true),
      };

      await AwaitService.sellOnThirdParty(strategy, awaitOrder);

      expect(strategy.status).toBe(AipStrategyModel.STRATEGY_STATUS_CLOSED);
      expect(strategy.stop_reason).toBe('profit auto sell');
    });

    it('should reset counters when auto_create is Y', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        now_quote_total: 0.5,
        quote_total: 0.5,
        base_total: 20000,
        now_base_total: 20000,
        now_buy_times: 10,
        buy_times: 10,
        sell_times: 0,
        user_market_id: 'market-1',
        auto_create: 'Y',
        save: jest.fn().mockResolvedValue(true),
      };

      const awaitOrder = {
        sell_type: AipAwaitModel.SELL_TYPE_AUTO_SELL,
        await_status: AipAwaitModel.STATUS_WAITING,
        save: jest.fn().mockResolvedValue(true),
      };

      await AwaitService.sellOnThirdParty(strategy, awaitOrder);

      expect(strategy.now_base_total).toBe(0);
      expect(strategy.now_buy_times).toBe(0);
      expect(strategy.value_total).toBe(0);
    });

    it('should soft delete strategy on user delete sell', async () => {
      const strategy = {
        _id: 'strat-1',
        exchange: 'binance',
        key: 'enc_api-key',
        secret: 'enc_api-secret',
        symbol: 'BTC/USDT',
        now_quote_total: 0.5,
        quote_total: 0.5,
        base_total: 20000,
        now_base_total: 20000,
        now_buy_times: 10,
        buy_times: 10,
        sell_times: 0,
        user_market_id: 'market-1',
        save: jest.fn().mockResolvedValue(true),
      };

      const awaitOrder = {
        sell_type: AipAwaitModel.SELL_TYPE_DEL_INVEST,
        await_status: AipAwaitModel.STATUS_WAITING,
        save: jest.fn().mockResolvedValue(true),
      };

      await AwaitService.sellOnThirdParty(strategy, awaitOrder);

      expect(strategy.status).toBe(AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED);
      expect(strategy.stop_reason).toBe('user delete sell');
    });
  });
});
