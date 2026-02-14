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
const AipStrategyModel = require('../../app/models/aipStrategyModel');
const PortalTokenModel = require('../../app/models/portalTokenModel');
const { createOrderData, createStrategyData, createTokenData } = require('../helpers/fixtures');

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

// Helper: create auth token and return headers
const createAuthHeaders = async (userId) => {
  const uid = userId || new mongoose.Types.ObjectId();
  const tokenData = createTokenData({
    user_id: uid,
    token: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
  });
  await PortalTokenModel.create(tokenData);
  return {
    token: tokenData.token,
    user_id: uid.toString(),
  };
};

describe('Order API Integration', () => {
  let userId;
  let authHeaders;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    authHeaders = await createAuthHeaders(userId);
  });

  describe('GET /api/v1/orders', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/orders');

      expect(res.status).toBe(401);
    });

    it('should return orders for a given strategy_id', async () => {
      const strategyId = new mongoose.Types.ObjectId().toString();
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      await AipOrderModel.create(createOrderData({ strategy_id: strategyId, side: 'buy' }));
      // Different strategy
      await AipOrderModel.create(createOrderData({ strategy_id: 'other-strat' }));

      const res = await request(app)
        .get(`/api/v1/orders?strategy_id=${strategyId}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
    });

    it('should return empty list when no orders match', async () => {
      const res = await request(app)
        .get('/api/v1/orders?strategy_id=nonexistent')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(0);
    });

    it('should handle missing strategy_id query param', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      // Without strategy_id, it queries with undefined which returns empty
      expect(res.status).toBe(200);
      expect(res.body.data.list).toBeDefined();
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return 401 when no auth headers provided', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/orders/${orderId}`);

      expect(res.status).toBe(401);
    });

    it('should return order detail when found', async () => {
      const auth = await createAuthHeaders();
      const order = await AipOrderModel.create(createOrderData({ side: 'buy' }));

      const res = await request(app)
        .get(`/api/v1/orders/${order._id}`)
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data._id).toBe(order._id.toString());
    });

    it('should return 404 when order not found', async () => {
      const auth = await createAuthHeaders();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/orders/${fakeId}`)
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/orders/statistics', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/orders/statistics');

      expect(res.status).toBe(401);
    });

    it('should return zero stats when user has no orders', async () => {
      const auth = await createAuthHeaders();

      const res = await request(app)
        .get('/api/v1/orders/statistics')
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.total_orders).toBe(0);
      expect(res.body.data.buy_count).toBe(0);
    });

    it('should return correct statistics for user orders', async () => {
      const auth = await createAuthHeaders();
      const userId = new mongoose.Types.ObjectId(auth.user_id);

      // Create a strategy belonging to this user
      const strategy = await AipStrategyModel.create(createStrategyData({ user: userId }));

      // Create orders for this strategy
      await AipOrderModel.create(
        createOrderData({
          strategy_id: strategy._id.toString(),
          side: 'buy',
          base_total: 100,
          profit: 0,
        })
      );
      await AipOrderModel.create(
        createOrderData({
          strategy_id: strategy._id.toString(),
          side: 'buy',
          base_total: 200,
          profit: 0,
        })
      );

      const res = await request(app)
        .get('/api/v1/orders/statistics')
        .set('token', auth.token)
        .set('user_id', auth.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.total_orders).toBe(2);
      expect(res.body.data.buy_count).toBe(2);
      expect(res.body.data.sell_count).toBe(0);
    });
  });
});
