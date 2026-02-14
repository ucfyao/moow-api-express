const request = require('supertest');
const mongoose = require('mongoose');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');

// Mock CCXT
jest.mock('ccxt');

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
const AipStrategyModel = require('../../app/models/aipStrategyModel');
const AipAwaitModel = require('../../app/models/aipAwaitModel');
const PortalTokenModel = require('../../app/models/portalTokenModel');
const { createStrategyData, createTokenData } = require('../helpers/fixtures');

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
  const token = await PortalTokenModel.create(
    createTokenData({
      user_id: userId,
      token: `session-${Date.now()}`,
      type: 'session',
    })
  );
  return {
    token: token.token,
    user_id: userId.toString(),
  };
};

describe('Strategy API Integration', () => {
  let userId;
  let authHeaders;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    authHeaders = await createAuthHeaders(userId);
  });

  describe('POST /api/v1/strategies', () => {
    it('should create a new strategy', async () => {
      const strategyData = {
        user_market_id: 'market-1',
        exchange: 'binance',
        key: 'test-key',
        secret: 'test-secret',
        symbol: 'BTC/USDT',
        base: 'USDT',
        quote: 'BTC',
        base_limit: 100,
        type: 1,
        period: '1',
        period_value: [10],
      };

      const res = await request(app)
        .post('/api/v1/strategies')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send(strategyData);

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data._id).toBeDefined();

      // Verify in database
      const saved = await AipStrategyModel.findById(res.body.data._id);
      expect(saved).not.toBeNull();
      expect(saved.exchange).toBe('binance');
      expect(saved.symbol).toBe('BTC/USDT');
      expect(saved.hour).toBeDefined();
      expect(saved.minute).toBeDefined();
    });

    it('should reject strategy with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/strategies')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({
          exchange: 'binance',
          // Missing most required fields
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/strategies', () => {
    it('should return strategies list when sent as POST body', async () => {
      // The controller reads params from req.body, so we must send JSON body.
      // GET with body is unusual but matches the controller's implementation.
      const res = await request(app)
        .get('/api/v1/strategies')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({ userId: userId.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.list).toBeDefined();
    });
  });

  describe('GET /api/v1/strategies/:id', () => {
    it('should return strategy details', async () => {
      const strategy = await AipStrategyModel.create(createStrategyData({ user: userId }));

      const res = await request(app)
        .get(`/api/v1/strategies/${strategy._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.info).toBeDefined();
    });
  });

  describe('PATCH /api/v1/strategies/:id', () => {
    it('should update strategy fields', async () => {
      const strategy = await AipStrategyModel.create(createStrategyData({ user: userId }));

      const res = await request(app)
        .patch(`/api/v1/strategies/${strategy._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({ base_limit: 200 });

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(strategy._id.toString());

      // Verify update in DB
      const updated = await AipStrategyModel.findById(strategy._id);
      expect(updated.base_limit).toBe(200);
    });

    it('should toggle strategy status', async () => {
      const strategy = await AipStrategyModel.create(createStrategyData({ user: userId }));

      const res = await request(app)
        .patch(`/api/v1/strategies/${strategy._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({ status: '2' });

      expect(res.status).toBe(200);

      const updated = await AipStrategyModel.findById(strategy._id);
      expect(updated.status).toBe(AipStrategyModel.STRATEGY_STATUS_CLOSED);
    });

    it('should return 404 for nonexistent strategy', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/v1/strategies/${fakeId}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({ base_limit: 200 });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/strategies/:id', () => {
    it('should soft delete a strategy', async () => {
      const strategy = await AipStrategyModel.create(createStrategyData({ user: userId }));

      const res = await request(app)
        .delete(`/api/v1/strategies/${strategy._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED);

      // Verify in DB
      const deleted = await AipStrategyModel.findById(strategy._id);
      expect(deleted.status).toBe(AipStrategyModel.STRATEGY_STATUS_SOFT_DELETED);

      // Verify an await order was created
      const awaitOrder = await AipAwaitModel.findOne({ strategy_id: strategy._id.toString() });
      expect(awaitOrder).not.toBeNull();
    });

    it('should return error for nonexistent strategy', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/strategies/${fakeId}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
