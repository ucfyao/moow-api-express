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
const PortalTokenModel = require('../../app/models/portalTokenModel');
const { createOrderData, createTokenData } = require('../helpers/fixtures');

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

// Helper to create auth token and return headers
const createAuthHeaders = async () => {
  const userId = new mongoose.Types.ObjectId();
  const tokenData = createTokenData({ user_id: userId });
  await PortalTokenModel.create(tokenData);
  return {
    token: tokenData.token,
    user_id: userId.toString(),
  };
};

describe('Order API Integration', () => {
  describe('GET /api/v1/orders', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/orders');

      expect(res.status).toBe(401);
    });

    it('should return orders for a given strategy_id', async () => {
      const auth = await createAuthHeaders();
      const strategyId = new mongoose.Types.ObjectId().toString();
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      // Different strategy
      await AipOrderModel.create(createOrderData({ strategy_id: 'other-strat' }));

      const res = await request(app)
        .get(`/api/v1/orders?strategy_id=${strategyId}`)
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
    });

    it('should return empty list when no orders match', async () => {
      const auth = await createAuthHeaders();
      const res = await request(app)
        .get('/api/v1/orders?strategy_id=nonexistent')
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(0);
    });

    it('should handle missing strategy_id query param', async () => {
      const auth = await createAuthHeaders();
      const res = await request(app)
        .get('/api/v1/orders')
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      // Without strategy_id, it queries with undefined which returns empty
      expect(res.status).toBe(200);
      expect(res.body.data.list).toBeDefined();
    });
  });
});
