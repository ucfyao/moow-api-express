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
const PortalRoleModel = require('../../app/models/portalRoleModel');
const PurchaseModel = require('../../app/models/purchaseModel');

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
 * Helper: create a regular authenticated user (no admin role).
 */
const createAuthUser = async () => {
  const userId = new mongoose.Types.ObjectId();
  await PortalUserModel.create({
    _id: userId,
    nick_name: 'PurchaseUser',
    email: `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'hashed',
    salt: `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: Math.floor(Math.random() * 100000),
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `purchase-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, tokenDoc };
};

/**
 * Helper: create an admin user with admin role (bypasses RBAC).
 */
const createAdminUser = async () => {
  const adminRole = await PortalRoleModel.create({
    role_name: 'admin',
    role_description: 'Administrator',
    resource: [],
  });

  const userId = new mongoose.Types.ObjectId();
  await PortalUserModel.create({
    _id: userId,
    nick_name: 'AdminUser',
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'hashed',
    salt: `salt-admin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: Math.floor(Math.random() * 100000),
    role: adminRole._id,
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `admin-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, tokenDoc };
};

describe('Purchase API Integration', () => {
  describe('POST /api/v1/purchases', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).post('/api/v1/purchases').send({
        eth_address: '0x123',
        tx_hash: '0xabc',
        amount: '0.1',
      });

      expect(res.status).toBe(401);
    });

    it('should submit a purchase successfully', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .post('/api/v1/purchases')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({
          eth_address: '0x1234567890abcdef',
          tx_hash: '0xabcdef1234567890',
          amount: '0.5',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('_id');

      // Verify in DB
      const purchase = await PurchaseModel.findById(res.body.data._id).lean();
      expect(purchase).not.toBeNull();
      expect(purchase.eth_address).toBe('0x1234567890abcdef');
      expect(purchase.status).toBe('waiting');
      expect(purchase.user.toString()).toBe(userId.toString());
    });

    it('should reject submission with missing required fields', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .post('/api/v1/purchases')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({
          eth_address: '0x123',
          // Missing tx_hash and amount
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/purchases', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .get('/api/v1/purchases')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should return list of purchases for admin user', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();
      const { userId: regularId } = await createAuthUser();

      // Seed purchases
      await PurchaseModel.create([
        {
          user: regularId,
          eth_address: '0xaaa',
          tx_hash: '0x111',
          amount: '0.1',
          email: 'test1@test.com',
        },
        {
          user: regularId,
          eth_address: '0xbbb',
          tx_hash: '0x222',
          amount: '0.2',
          email: 'test2@test.com',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/purchases')
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toHaveLength(2);
      expect(res.body.data).toHaveProperty('total', 2);
    });
  });

  describe('GET /api/v1/purchases/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/purchases/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should return purchase details for admin user', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      const purchase = await PurchaseModel.create({
        user: adminId,
        eth_address: '0xdetails',
        tx_hash: '0xdetailstx',
        amount: '1.5',
        email: 'details@test.com',
      });

      const res = await request(app)
        .get(`/api/v1/purchases/${purchase._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.eth_address).toBe('0xdetails');
      expect(res.body.data.amount).toBe('1.5');
    });

    it('should return error for non-existent purchase', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/v1/purchases/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/purchases/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .patch(`/api/v1/purchases/${fakeId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({ status: 'success' });

      expect(res.status).toBe(403);
    });

    it('should update purchase status for admin', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      const purchase = await PurchaseModel.create({
        user: adminId,
        eth_address: '0xupdate',
        tx_hash: '0xupdatetx',
        amount: '0.3',
      });

      const res = await request(app)
        .patch(`/api/v1/purchases/${purchase._id}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString())
        .send({ status: 'success', comment: 'Verified on chain' });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);

      // Verify in DB
      const updated = await PurchaseModel.findById(purchase._id).lean();
      expect(updated.status).toBe('success');
      expect(updated.comment).toBe('Verified on chain');
    });
  });

  describe('POST /api/v1/purchases/:id/promote', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc } = await createAuthUser();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/v1/purchases/${fakeId}/promote`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should promote purchase and extend VIP for admin', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      // Create a user whose VIP will be extended
      const targetUser = await PortalUserModel.create({
        nick_name: 'VIPUser',
        email: `vip-${Date.now()}@test.com`,
        password: 'hashed',
        salt: `salt-vip-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        seq_id: Math.floor(Math.random() * 100000),
        vip_time_out_at: new Date(),
      });

      const purchase = await PurchaseModel.create({
        user: targetUser._id,
        eth_address: '0xpromote',
        tx_hash: '0xpromotetx',
        amount: '0.5',
      });

      const res = await request(app)
        .post(`/api/v1/purchases/${purchase._id}/promote`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('vip_time_out_at');

      // Verify purchase status changed to success
      const updatedPurchase = await PurchaseModel.findById(purchase._id).lean();
      expect(updatedPurchase.status).toBe('success');

      // Verify user VIP was extended
      const updatedUser = await PortalUserModel.findById(targetUser._id).lean();
      expect(new Date(updatedUser.vip_time_out_at).getTime()).toBeGreaterThan(
        new Date(targetUser.vip_time_out_at).getTime()
      );
    });
  });
});
