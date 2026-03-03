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

const createTestApp = require('../helpers/app');
const PortalUserModel = require('../../app/models/portalUserModel');
const PortalTokenModel = require('../../app/models/portalTokenModel');
const PortalMarketModel = require('../../app/models/portalMarketModel');

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
 * Returns { userId, tokenDoc }.
 */
const createAuthUser = async () => {
  const userId = new mongoose.Types.ObjectId();
  await PortalUserModel.create({
    _id: userId,
    nick_name: 'MarketTestUser',
    email: `market-test-${Date.now()}@test.com`,
    password: 'hashed',
    salt: `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: Math.floor(Math.random() * 100000),
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `market-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, tokenDoc };
};

describe('Market API Integration', () => {
  describe('GET /api/v1/markets', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/markets');

      expect(res.status).toBe(401);
    });

    it('should return list of markets', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      // Seed markets
      await PortalMarketModel.create([
        { name: 'Binance', exchange: `binance-${Date.now()}`, is_deleted: false },
        { name: 'OKX', exchange: `okx-${Date.now()}`, is_deleted: false },
      ]);

      const res = await request(app)
        .get('/api/v1/markets')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
      expect(res.body.data).toHaveProperty('total', 2);
    });

    it('should not return soft-deleted markets', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      await PortalMarketModel.create([
        { name: 'Active Market', exchange: `active-${Date.now()}`, is_deleted: false },
        { name: 'Deleted Market', exchange: `deleted-${Date.now()}`, is_deleted: true },
      ]);

      const res = await request(app)
        .get('/api/v1/markets')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(1);
      expect(res.body.data.list[0].name).toBe('Active Market');
    });
  });

  describe('POST /api/v1/markets', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).post('/api/v1/markets').send({
        name: 'TestExchange',
        exchange: 'testexchange',
      });

      expect(res.status).toBe(401);
    });

    it('should create a new market', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const exchangeName = `newexchange-${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/markets')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({
          name: 'New Exchange',
          exchange: exchangeName,
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('_id');

      // Verify in DB
      const market = await PortalMarketModel.findById(res.body.data._id);
      expect(market).not.toBeNull();
      expect(market.name).toBe('New Exchange');
      expect(market.exchange).toBe(exchangeName);
    });

    it('should reject creation with missing required fields', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .post('/api/v1/markets')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({
          // Missing name and exchange
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/markets/:id', () => {
    it('should return a market by ID', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const market = await PortalMarketModel.create({
        name: 'Binance',
        exchange: `binance-show-${Date.now()}`,
        url: 'https://binance.com',
      });

      const res = await request(app)
        .get(`/api/v1/markets/${market._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe('Binance');
    });

    it('should return error for non-existent market', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/markets/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/v1/markets/:id', () => {
    it('should update a market', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const market = await PortalMarketModel.create({
        name: 'Old Name',
        exchange: `oldexchange-${Date.now()}`,
      });

      const res = await request(app)
        .put(`/api/v1/markets/${market._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('_id');

      // Verify in DB
      const updated = await PortalMarketModel.findById(market._id).lean();
      expect(updated.name).toBe('Updated Name');
    });

    it('should return error when updating non-existent market', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/markets/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({ name: 'Updated' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/markets/:id', () => {
    it('should soft delete a market', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const market = await PortalMarketModel.create({
        name: 'ToDelete',
        exchange: `todelete-${Date.now()}`,
      });

      const res = await request(app)
        .delete(`/api/v1/markets/${market._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);

      // Verify soft delete in DB
      const deleted = await PortalMarketModel.findById(market._id).lean();
      expect(deleted.is_deleted).toBe(true);
    });

    it('should return error when deleting non-existent market', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/markets/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
