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

// Mock schedulerRegistry so /health doesn't depend on real schedulers
jest.mock('../../app/utils/schedulerRegistry', () => ({
  getStatus: jest.fn().mockReturnValue([]),
  register: jest.fn(),
}));

const createTestApp = require('../helpers/app');
const DataBtcHistoryModel = require('../../app/models/dataBtcHistoryModel');
const CommonConfigModel = require('../../app/models/commonConfigModel');
const AipOrderModel = require('../../app/models/aipOrderModel');

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

describe('Home API Integration', () => {
  describe('GET /', () => {
    it('should return service live message', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('service is live');
    });
  });

  describe('GET /test', () => {
    it('should return hashids encode/decode result', async () => {
      const res = await request(app).get('/test');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('x');
      expect(res.body).toHaveProperty('y');
      // hashidsEncode(1) should produce a string, hashidsDecode should return 1
      expect(typeof res.body.x).toBe('string');
      expect(res.body.y).toBe(1);
    });
  });

  describe('GET /health', () => {
    it('should return health check with status ok when connected', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('mongodb');
      expect(res.body.mongodb.status).toBe('connected');
      expect(res.body).toHaveProperty('memory');
      expect(res.body.memory).toHaveProperty('rss');
      expect(res.body.memory).toHaveProperty('heapUsed');
    });
  });

  describe('GET /api/v1/public/btc-history', () => {
    it('should return empty list when no data exists', async () => {
      const res = await request(app).get('/api/v1/public/btc-history');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toEqual([]);
    });

    it('should return BTC history data sorted chronologically', async () => {
      // Seed BTC history data
      await DataBtcHistoryModel.create([
        { date: '2025-01-01', open: 40000, high: 41000, low: 39000, close: 40500, volume: 1000 },
        { date: '2025-01-02', open: 40500, high: 42000, low: 40000, close: 41500, volume: 1200 },
        { date: '2025-01-03', open: 41500, high: 43000, low: 41000, close: 42000, volume: 1100 },
      ]);

      const res = await request(app).get('/api/v1/public/btc-history');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(3);
      // Should be in chronological order (oldest first)
      expect(res.body.data.list[0].date).toBe('2025-01-01');
      expect(res.body.data.list[2].date).toBe('2025-01-03');
    });

    it('should respect the limit query parameter', async () => {
      await DataBtcHistoryModel.create([
        { date: '2025-01-01', open: 40000, high: 41000, low: 39000, close: 40500, volume: 1000 },
        { date: '2025-01-02', open: 40500, high: 42000, low: 40000, close: 41500, volume: 1200 },
        { date: '2025-01-03', open: 41500, high: 43000, low: 41000, close: 42000, volume: 1100 },
      ]);

      const res = await request(app).get('/api/v1/public/btc-history?limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(2);
    });
  });

  describe('GET /api/v1/public/dingtou/orders', () => {
    it('should return empty list when no config exists', async () => {
      const res = await request(app).get('/api/v1/public/dingtou/orders');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toEqual([]);
    });

    it('should return orders for the configured dingtou strategy', async () => {
      const strategyId = new mongoose.Types.ObjectId().toString();

      // Seed the dingtou_id config
      await CommonConfigModel.create({
        name: 'dingtou_id',
        content: strategyId,
      });

      // Seed some orders for this strategy
      await AipOrderModel.create([
        {
          strategy_id: strategyId,
          order_id: 'order-1',
          type: 'market',
          side: 'buy',
          price: '50000',
          amount: '0.002',
          symbol: 'BTC/USDT',
        },
        {
          strategy_id: strategyId,
          order_id: 'order-2',
          type: 'market',
          side: 'buy',
          price: '51000',
          amount: '0.002',
          symbol: 'BTC/USDT',
        },
      ]);

      const res = await request(app).get('/api/v1/public/dingtou/orders');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
      expect(res.body.data.list[0]).toHaveProperty('strategy_id', strategyId);
    });

    it('should return empty list when strategy has no orders', async () => {
      await CommonConfigModel.create({
        name: 'dingtou_id',
        content: new mongoose.Types.ObjectId().toString(),
      });

      const res = await request(app).get('/api/v1/public/dingtou/orders');

      expect(res.status).toBe(200);
      expect(res.body.data.list).toEqual([]);
    });
  });
});
