const mongoose = require('mongoose');

const createUserData = (overrides = {}) => ({
  nick_name: 'TestUser',
  email: `test-${Date.now()}@example.com`,
  password: 'hashedpassword123',
  salt: `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  seq_id: Math.floor(Math.random() * 100000),
  invitation_code: 'ABC123',
  is_activated: false,
  is_deleted: false,
  vip_time_out_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  ...overrides,
});

const createStrategyData = (overrides = {}) => ({
  user: new mongoose.Types.ObjectId(),
  period: '1',
  period_value: [10],
  hour: '12',
  minute: '30',
  user_market_id: 'market-1',
  exchange: 'binance',
  key: 'test-api-key',
  secret: 'test-api-secret',
  symbol: 'BTC/USDT',
  base: 'USDT',
  quote: 'BTC',
  base_limit: 100,
  base_total: 500,
  quote_total: 0.05,
  buy_times: 5,
  now_buy_times: 3,
  now_base_total: 300,
  now_quote_total: 0.03,
  type: 1,
  status: 1,
  stop_profit_percentage: 20,
  drawdown: 5,
  drawdown_status: 'N',
  expect_frowth_rate: 0.008,
  ...overrides,
});

const createOrderData = (overrides = {}) => ({
  strategy_id: new mongoose.Types.ObjectId().toString(),
  order_id: `order-${Date.now()}`,
  type: 'market',
  side: 'buy',
  price: '50000',
  amount: '0.002',
  symbol: 'BTC/USDT',
  funds: '100',
  avg_price: '50000',
  deal_amount: '0.002',
  cost: '100',
  status: 'open',
  mid: 'market-1',
  buy_times: 1,
  now_buy_times: 1,
  base_total: 100,
  quote_total: 0.002,
  value_total: 100,
  ...overrides,
});

const createExchangeKeyData = (overrides = {}) => ({
  uid: new mongoose.Types.ObjectId(),
  exchange: 'binance',
  access_key: 'encrypted-access-key',
  secret_key: 'encrypted-secret-key',
  secret_show: 'tes******key',
  desc: 'Test exchange key',
  is_deleted: false,
  ...overrides,
});

const createTokenData = (overrides = {}) => ({
  user_id: new mongoose.Types.ObjectId(),
  token: `token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  user_ip: '127.0.0.1',
  email: 'test@example.com',
  nick_name: 'TestUser',
  type: 'session',
  last_access_time: new Date(),
  ...overrides,
});

module.exports = {
  createUserData,
  createStrategyData,
  createOrderData,
  createExchangeKeyData,
  createTokenData,
};
