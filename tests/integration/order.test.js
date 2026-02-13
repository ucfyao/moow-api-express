const request = require('supertest');
const mongoose = require('mongoose');
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
const AipOrderModel = require('../../app/models/aipOrderModel');
const { createOrderData } = require('../helpers/fixtures');

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

describe('Order API Integration', () => {
  describe('GET /api/v1/orders', () => {
    it('should return orders for a given strategy_id', async () => {
      const strategyId = new mongoose.Types.ObjectId().toString();
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      // Different strategy
      await AipOrderModel.create(createOrderData({ strategy_id: 'other-strat' }));

      const res = await request(app).get(`/api/v1/orders?strategy_id=${strategyId}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
    });

    it('should return empty list when no orders match', async () => {
      const res = await request(app).get('/api/v1/orders?strategy_id=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(0);
    });

    it('should handle missing strategy_id query param', async () => {
      const res = await request(app).get('/api/v1/orders');

      // Without strategy_id, it queries with undefined which returns empty
      expect(res.status).toBe(200);
      expect(res.body.data.list).toBeDefined();
    });
  });
});
