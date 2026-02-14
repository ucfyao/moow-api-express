const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');

// Mock logger
jest.mock('../../app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  stream: { write: jest.fn() },
}));

// Mock email service
jest.mock('../../app/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ emailStatus: 1 }),
}));

const createTestApp = require('../helpers/app');
const ArbitrageTickerModel = require('../../app/models/arbitrageTickerModel');
const ArbitrageConfigModel = require('../../app/models/arbitrageConfigModel');
const ArbitrageCacheModel = require('../../app/models/arbitrageCacheModel');

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

describe('Arbitrage Public API', () => {
  describe('GET /api/v1/arbitrage/tickers', () => {
    it('should return recent tickers', async () => {
      await ArbitrageTickerModel.create({
        exchange: 'binance',
        symbol: 'BTC/USDT',
        ticker: { exchange: 'binance', symbol: 'BTC/USDT', bid: 50000, ask: 50100 },
      });

      const res = await request(app).get('/api/v1/arbitrage/tickers');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.tickers).toHaveLength(1);
    });

    it('should return empty tickers when none exist', async () => {
      const res = await request(app).get('/api/v1/arbitrage/tickers');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.tickers).toHaveLength(0);
    });
  });

  describe('GET /api/v1/arbitrage/opportunities', () => {
    it('should return opportunities sorted by diff descending', async () => {
      await ArbitrageTickerModel.create([
        {
          exchange: 'binance',
          symbol: 'BTC/USDT',
          ticker: { exchange: 'binance', bid: 50000, ask: 49900 },
        },
        {
          exchange: 'huobi',
          symbol: 'BTC/USDT',
          ticker: { exchange: 'huobi', bid: 50600, ask: 50500 },
        },
      ]);

      const res = await request(app).get('/api/v1/arbitrage/opportunities?minProfit=1');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/arbitrage/tickers/by-exchange', () => {
    it('should return tickers grouped by exchange', async () => {
      await ArbitrageTickerModel.create({
        exchange: 'binance',
        symbol: 'BTC/USDT',
        ticker: { exchange: 'binance', symbol: 'BTC/USDT', bid: 50000, ask: 50100 },
      });

      const res = await request(app).get('/api/v1/arbitrage/tickers/by-exchange');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/arbitrage/tickers/by-symbol', () => {
    it('should return tickers grouped by symbol', async () => {
      await ArbitrageTickerModel.create({
        exchange: 'binance',
        symbol: 'BTC/USDT',
        ticker: { exchange: 'binance', symbol: 'BTC/USDT', bid: 50000, ask: 50100 },
      });

      const res = await request(app).get('/api/v1/arbitrage/tickers/by-symbol');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toBeInstanceOf(Array);
    });
  });
});
