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
const UserService = require('../../app/services/userService');

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
 * Helper: create a regular authenticated user.
 */
const createAuthUser = async (overrides = {}) => {
  const userId = new mongoose.Types.ObjectId();
  const seqId = overrides.seq_id || Math.floor(Math.random() * 100000);
  const user = await PortalUserModel.create({
    nick_name: overrides.nick_name || 'TestUser',
    email: overrides.email || `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'hashed',
    salt: `salt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: seqId,
    invitation_code: overrides.invitation_code || 'ABC123',
    ...overrides,
    _id: userId,
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `user-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, user, tokenDoc, seqId };
};

/**
 * Helper: create an admin user with admin role.
 */
const createAdminUser = async () => {
  const adminRole = await PortalRoleModel.create({
    role_name: 'admin',
    role_description: 'Administrator',
    resource: [],
  });

  const userId = new mongoose.Types.ObjectId();
  const seqId = Math.floor(Math.random() * 100000);
  const user = await PortalUserModel.create({
    _id: userId,
    nick_name: 'AdminUser',
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'hashed',
    salt: `salt-admin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    seq_id: seqId,
    role: adminRole._id,
  });
  const tokenDoc = await PortalTokenModel.create({
    user_id: userId,
    token: `admin-token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'session',
    last_access_time: new Date(),
  });
  return { userId, user, tokenDoc, seqId };
};

describe('User API Integration', () => {
  describe('GET /api/v1/users', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/users');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .get('/api/v1/users')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should return list of users for admin', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      // Create additional users
      await createAuthUser({ nick_name: 'User1' });
      await createAuthUser({ nick_name: 'User2' });

      const res = await request(app)
        .get('/api/v1/users')
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThanOrEqual(3); // admin + 2 users
      expect(res.body.data).toHaveProperty('total');
      // Should not include password or salt
      res.body.data.list.forEach((user) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('salt');
      });
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/users/profile');

      expect(res.status).toBe(401);
    });

    it('should return current user profile', async () => {
      const { userId, tokenDoc, seqId } = await createAuthUser({
        nick_name: 'ProfileUser',
      });

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.nick_name).toBe('ProfileUser');
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('salt');
      // Should have ref_code generated from seq_id
      expect(res.body.data).toHaveProperty('ref_code');
    });
  });

  describe('GET /api/v1/users/invitations', () => {
    it('should return 401 when no auth headers provided', async () => {
      const res = await request(app).get('/api/v1/users/invitations');

      expect(res.status).toBe(401);
    });

    it('should return empty list when user has no invitees', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      const res = await request(app)
        .get('/api/v1/users/invitations')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it('should return list of invited users', async () => {
      const { userId, tokenDoc } = await createAuthUser();

      // Create users that were invited by this user
      await PortalUserModel.create([
        {
          nick_name: 'Invitee1',
          email: `invitee1-${Date.now()}@test.com`,
          password: 'hashed',
          salt: `salt-inv1-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          seq_id: Math.floor(Math.random() * 100000),
          inviter: userId,
        },
        {
          nick_name: 'Invitee2',
          email: `invitee2-${Date.now()}@test.com`,
          password: 'hashed',
          salt: `salt-inv2-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          seq_id: Math.floor(Math.random() * 100000),
          inviter: userId,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/users/invitations')
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.list).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc, seqId } = await createAuthUser();

      const res = await request(app)
        .get(`/api/v1/users/${seqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should return user by seq_id for admin', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();
      const { seqId } = await createAuthUser({ nick_name: 'TargetUser' });

      const res = await request(app)
        .get(`/api/v1/users/${seqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.nick_name).toBe('TargetUser');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return error for non-existent user', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      const res = await request(app)
        .get('/api/v1/users/999999')
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc, seqId } = await createAuthUser();

      const res = await request(app)
        .patch(`/api/v1/users/${seqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString())
        .send({ nick_name: 'Updated' });

      expect(res.status).toBe(403);
    });

    it('should update user info for admin', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();
      const { seqId } = await createAuthUser({ nick_name: 'BeforeUpdate' });

      const res = await request(app)
        .patch(`/api/v1/users/${seqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString())
        .send({ nick_name: 'AfterUpdate' });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.nick_name).toBe('AfterUpdate');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return error for non-existent user', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();

      const res = await request(app)
        .patch('/api/v1/users/999999')
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString())
        .send({ nick_name: 'NoUser' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const { userId, tokenDoc, seqId } = await createAuthUser();

      const res = await request(app)
        .delete(`/api/v1/users/${seqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', userId.toString());

      expect(res.status).toBe(403);
    });

    it('should soft delete user for admin (when admin is the user)', async () => {
      const { userId: adminId, tokenDoc, seqId: adminSeqId } = await createAdminUser();

      // The deleteUser service checks user._id == requestUserId
      // Admin deleting their own account should work
      const res = await request(app)
        .delete(`/api/v1/users/${adminSeqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('seq_id');

      // Verify soft delete in DB
      const deleted = await PortalUserModel.findById(adminId).lean();
      expect(deleted.is_deleted).toBe(true);
    });

    it('should return 403 when admin tries to delete another user', async () => {
      const { userId: adminId, tokenDoc } = await createAdminUser();
      const { seqId: targetSeqId } = await createAuthUser();

      // deleteUser checks user._id.toString() !== requestUserId → 403
      const res = await request(app)
        .delete(`/api/v1/users/${targetSeqId}`)
        .set('token', tokenDoc.token)
        .set('user_id', adminId.toString());

      expect(res.status).toBe(403);
    });
  });
});
