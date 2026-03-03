const request = require('supertest');
const mongoose = require('mongoose');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');

// Mock email service to avoid sending real emails
jest.mock('../../app/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ emailStatus: 1 }),
}));

// Mock logger to reduce noise
jest.mock('../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  stream: { write: jest.fn() },
}));

// Mock ccxt to avoid hitting real exchanges
jest.mock('ccxt', () => {
  const MockExchange = jest.fn(() => ({
    fetchTicker: jest.fn().mockResolvedValue({
      symbol: 'BTC/USDT',
      ask: 50000,
      bid: 49900,
      last: 49950,
    }),
    fetchBalance: jest.fn().mockResolvedValue({
      USDT: { free: 10000, used: 0, total: 10000 },
    }),
    fetchOHLCV: jest.fn().mockResolvedValue([[1704067200000, 42000, 43000, 41000, 42500, 1000]]),
    urls: { www: 'https://binance.com', api: 'https://api.binance.com' },
  }));
  return {
    binance: MockExchange,
    okex: MockExchange,
    huobi: MockExchange,
  };
});

const createTestApp = require('../helpers/app');
const PortalUserModel = require('../../app/models/portalUserModel');
const PortalTokenModel = require('../../app/models/portalTokenModel');
const DataExchangeSymbolModel = require('../../app/models/dataExchangeSymbolModel');

let app;

beforeAll(async () => {
  await connect();
  app = createTestApp();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

/**
 * Helper: create an authenticated user with token.
 */
const createAuthUser = async () => {
  const userId = new mongoose.Types.ObjectId();
  await PortalUserModel.create({
    _id: userId,
    nick_name: 'SymbolTestUser',
    email: `symbol-test-${Date.now()}@test.com`,
    password: 'hashed',
    salt: `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: Math.floor(Math.random() * 100000),
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `symbol-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, tokenDoc };
};

describe('Symbol API Integration', () => {
  describe('GET /api/v1/symbols', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/symbols');

      expect(res.status).toBe(401);
    });

    it('should return list of symbols', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      // Seed symbols with unique on_time values
      await DataExchangeSymbolModel.create([
        {
          key: 'binance_BTC/USDT',
          exchange: 'binance',
          symbol: 'BTC/USDT',
          base: 'BTC',
          quote: 'USDT',
          price_usd: '50000',
          on_time: new Date('2025-01-01T00:00:00Z'),
        },
        {
          key: 'binance_ETH/USDT',
          exchange: 'binance',
          symbol: 'ETH/USDT',
          base: 'ETH',
          quote: 'USDT',
          price_usd: '3000',
          on_time: new Date('2025-01-02T00:00:00Z'),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/symbols')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
      expect(res.body.data).toHaveProperty('total', 2);
    });

    it('should filter symbols by exchange query param', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      await DataExchangeSymbolModel.create([
        {
          key: 'binance_BTC/USDT',
          exchange: 'binance',
          symbol: 'BTC/USDT',
          base: 'BTC',
          quote: 'USDT',
          on_time: new Date('2025-02-01T00:00:00Z'),
        },
        {
          key: 'okx_BTC/USDT',
          exchange: 'okx',
          symbol: 'BTC/USDT',
          base: 'BTC',
          quote: 'USDT',
          on_time: new Date('2025-02-02T00:00:00Z'),
        },
      ]);

      const res = await request(app)
        .get('/api/v1/symbols?exchange=binance')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(1);
      expect(res.body.data.list[0].exchange).toBe('binance');
    });
  });

  describe('GET /api/v1/symbols/:id', () => {
    it('should return a symbol by ID', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const symbol = await DataExchangeSymbolModel.create({
        key: 'binance_BTC/USDT',
        exchange: 'binance',
        symbol: 'BTC/USDT',
        base: 'BTC',
        quote: 'USDT',
        price_usd: '50000',
        on_time: new Date('2025-03-01T00:00:00Z'),
      });

      const res = await request(app)
        .get(`/api/v1/symbols/${symbol._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.exchange).toBe('binance');
      expect(res.body.data.symbol).toBe('BTC/USDT');
    });

    it('should return null data for non-existent symbol', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/symbols/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      // The service returns null for non-existent symbol (no CustomError thrown)
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe('POST /api/v1/symbols', () => {
    it('should create a new symbol', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .post('/api/v1/symbols')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({
          key: 'binance_SOL/USDT',
          exchange: 'binance',
          symbol: 'SOL/USDT',
          base: 'SOL',
          quote: 'USDT',
          price_usd: '100',
          on_time: new Date('2025-04-01T00:00:00Z').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('newExchangeSymbol');
      expect(res.body.data.newExchangeSymbol).toHaveProperty('_id');

      // Verify in DB
      const created = await DataExchangeSymbolModel.findById(
        res.body.data.newExchangeSymbol._id
      ).lean();
      expect(created).not.toBeNull();
      expect(created.symbol).toBe('SOL/USDT');
    });

    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).post('/api/v1/symbols').send({
        exchange: 'binance',
        symbol: 'SOL/USDT',
      });

      expect(res.status).toBe(401);
    });
  });
});
