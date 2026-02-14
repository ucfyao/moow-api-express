/**
 * Creates a mock CCXT exchange instance with default behaviors.
 * Pass overrides to customize individual methods.
 */
const createMockExchange = (overrides = {}) => ({
  fetchTicker: jest.fn().mockResolvedValue({
    symbol: 'BTC/USDT',
    ask: 50000,
    bid: 49900,
    last: 49950,
    high: 51000,
    low: 49000,
  }),
  fetchBalance: jest.fn().mockResolvedValue({
    USDT: { free: 10000, used: 0, total: 10000 },
    BTC: { free: 1.0, used: 0, total: 1.0 },
    free: { USDT: 10000, BTC: 1.0 },
    used: { USDT: 0, BTC: 0 },
    total: { USDT: 10000, BTC: 1.0 },
    info: { balances: [{ asset: 'USDT', free: '10000' }] },
  }),
  createOrder: jest.fn().mockResolvedValue({
    id: 'mock-order-123',
    symbol: 'BTC/USDT',
    type: 'market',
    side: 'buy',
    amount: 0.002,
    price: 50000,
    status: 'closed',
  }),
  fetchOrder: jest.fn().mockResolvedValue({
    id: 'mock-order-123',
    symbol: 'BTC/USDT',
    type: 'market',
    side: 'buy',
    amount: 0.002,
    average: 50000,
    filled: 0.002,
    cost: 100,
    status: 'closed',
    info: {},
  }),
  fetchOpenOrders: jest.fn().mockResolvedValue([]),
  cancelAllOrders: jest.fn().mockResolvedValue([]),
  loadMarkets: jest.fn().mockResolvedValue({
    'BTC/USDT': {
      symbol: 'BTC/USDT',
      limits: {
        amount: { min: 0.00001, max: 9000 },
        cost: { min: 5, max: undefined },
      },
    },
  }),
  markets: {
    'BTC/USDT': {
      symbol: 'BTC/USDT',
      limits: {
        amount: { min: 0.00001, max: 9000 },
        cost: { min: 5, max: undefined },
      },
    },
  },
  ...overrides,
});

/**
 * Sets up a jest mock for the ccxt module.
 * Returns the mock exchange constructor.
 * Usage:
 *   jest.mock('ccxt');
 *   const ccxt = require('ccxt');
 *   setupCcxtMock(ccxt, mockExchange);
 */
const setupCcxtMock = (ccxtModule, mockExchange) => {
  const MockExchangeClass = jest.fn(() => mockExchange);
  /* eslint-disable no-param-reassign */
  ccxtModule.binance = MockExchangeClass;
  ccxtModule.okex = MockExchangeClass;
  ccxtModule.huobi = MockExchangeClass;
  /* eslint-enable no-param-reassign */
  return MockExchangeClass;
};

module.exports = {
  createMockExchange,
  setupCcxtMock,
};
