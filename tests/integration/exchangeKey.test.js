const request = require('supertest');
const mongoose = require('mongoose');
const { connect, closeDatabase, clearDatabase } = require('../helpers/db');

// Mock CCXT
jest.mock('ccxt');

// Mock cryptoUtils
jest.mock('../../app/utils/cryptoUtils', () => ({
  encrypt: jest.fn((val) => `enc_${val}`),
  decrypt: jest.fn((val) => {
    // Strip 'enc_' prefix if present
    const plain = val.startsWith('enc_') ? val.slice(4) : val;
    return plain;
  }),
}));

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

const ccxt = require('ccxt');
const createTestApp = require('../helpers/app');
const AipExchangeKeyModel = require('../../app/models/aipExchangeKeyModel');
const PortalTokenModel = require('../../app/models/portalTokenModel');
const { createMockExchange, setupCcxtMock } = require('../helpers/mockCcxt');
const { createExchangeKeyData, createTokenData } = require('../helpers/fixtures');

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

describe('ExchangeKey API Integration', () => {
  let userId;
  let authHeaders;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    authHeaders = await createAuthHeaders(userId);
  });

  describe('POST /api/v1/keys', () => {
    it('should create a new exchange key after CCXT validation', async () => {
      const mockExchange = createMockExchange();
      setupCcxtMock(ccxt, mockExchange);

      const res = await request(app)
        .post('/api/v1/keys')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({
          exchange: 'binance',
          access_key: 'my-access-key-123',
          secret_key: 'my-secret-key-456',
          desc: 'My Binance key',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.exchangeKey).toBeDefined();
      expect(res.body.data.validation).toBeDefined();

      // Verify the key was saved
      const keys = await AipExchangeKeyModel.find({});
      expect(keys).toHaveLength(1);
      expect(keys[0].exchange).toBe('binance');
    });

    it('should reject key creation with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/keys')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id)
        .send({
          exchange: 'binance',
          // Missing access_key, secret_key, desc
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/keys', () => {
    it('should return desensitized key list', async () => {
      // Create a key directly in DB
      await AipExchangeKeyModel.create(
        createExchangeKeyData({
          access_key: 'enc_abcdefghijk',
          secret_key: 'enc_xyz123456789',
        })
      );

      const res = await request(app)
        .get('/api/v1/keys')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.list).toBeDefined();
      expect(res.body.data.list).toHaveLength(1);
      // Keys should be desensitized
      expect(res.body.data.list[0].access_key).toContain('******');
      expect(res.body.data.list[0].secret_key).toContain('******');
    });

    it('should filter out deleted keys by default', async () => {
      await AipExchangeKeyModel.create(createExchangeKeyData({ is_deleted: false }));
      await AipExchangeKeyModel.create(createExchangeKeyData({ is_deleted: true }));

      const res = await request(app)
        .get('/api/v1/keys')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(1);
    });

    it('should show deleted keys when showDeleted=true', async () => {
      await AipExchangeKeyModel.create(createExchangeKeyData({ is_deleted: true }));

      const res = await request(app)
        .get('/api/v1/keys?showDeleted=true')
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(1);
    });
  });

  describe('DELETE /api/v1/keys/:id', () => {
    it('should soft delete an exchange key', async () => {
      const key = await AipExchangeKeyModel.create(createExchangeKeyData());

      const res = await request(app)
        .delete(`/api/v1/keys/${key._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);

      // Verify soft delete in DB
      const updated = await AipExchangeKeyModel.findById(key._id);
      expect(updated.is_deleted).toBe(true);
      expect(updated.status).toBe(AipExchangeKeyModel.KEY_STATUS_SOFT_DELETED);
    });
  });

  describe('GET /api/v1/keys/:id', () => {
    it('should return a single desensitized key', async () => {
      const key = await AipExchangeKeyModel.create(
        createExchangeKeyData({
          access_key: 'enc_abcdefghijk',
          secret_key: 'enc_xyz123456789',
        })
      );

      const res = await request(app)
        .get(`/api/v1/keys/${key._id}`)
        .set('token', authHeaders.token)
        .set('user_id', authHeaders.user_id);

      expect(res.status).toBe(200);
      expect(res.body.data.access_key).toContain('******');
      expect(res.body.data.secret_key).toContain('******');
    });
  });
});
