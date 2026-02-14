const crypto = require('crypto');

// Mock the PortalUserModel before requiring the service
jest.mock('../../../app/models/portalUserModel');
jest.mock('../../../app/utils/hashidsHandler');
const PortalUserModel = require('../../../app/models/portalUserModel');
const { hashidsEncode } = require('../../../app/utils/hashidsHandler');
const UserService = require('../../../app/services/userService');
const CustomError = require('../../../app/utils/customError');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePassword()', () => {
    it('should return an object with salt and hashed password', async () => {
      const result = await UserService.generatePassword('mypassword123');

      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('password');
      expect(typeof result.salt).toBe('string');
      expect(typeof result.password).toBe('string');
    });

    it('should generate different salts for the same password', async () => {
      const result1 = await UserService.generatePassword('mypassword123');
      const result2 = await UserService.generatePassword('mypassword123');

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.password).not.toBe(result2.password);
    });

    it('should produce a base64-encoded password', async () => {
      const result = await UserService.generatePassword('testpass');

      // Base64 strings only contain these characters
      expect(result.password).toMatch(/^[A-Za-z0-9+/=]+$/);
      expect(result.salt).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should produce consistent hash with known salt using PBKDF2', async () => {
      const password = 'testpassword';
      const result = await UserService.generatePassword(password);

      // Verify independently using crypto
      const expectedHash = crypto
        .pbkdf2Sync(password, result.salt, 1000, 32, 'sha512')
        .toString('base64');
      expect(result.password).toBe(expectedHash);
    });
  });

  describe('comparePassword()', () => {
    it('should return true for correct password', async () => {
      const password = 'correct-password';
      const generated = await UserService.generatePassword(password);

      const result = await UserService.comparePassword(
        password,
        generated.salt,
        generated.password
      );
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const generated = await UserService.generatePassword('correct-password');

      const result = await UserService.comparePassword(
        'wrong-password',
        generated.salt,
        generated.password
      );
      expect(result).toBe(false);
    });

    it('should return false for wrong salt', async () => {
      const password = 'test-password';
      const generated = await UserService.generatePassword(password);

      const result = await UserService.comparePassword(password, 'wrong-salt', generated.password);
      expect(result).toBe(false);
    });
  });

  describe('getUserById()', () => {
    it('should query by seq_id and exclude password/salt', async () => {
      const mockUser = { seq_id: 1, nick_name: 'Test', email: 'test@test.com' };
      PortalUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await UserService.getUserById(1);

      expect(PortalUserModel.findOne).toHaveBeenCalledWith({ seq_id: 1 });
      expect(result).toEqual(mockUser);
    });

    it('should throw CustomError when user not found', async () => {
      PortalUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(UserService.getUserById(999)).rejects.toThrow();
    });

    it('should return filtered data when query params are provided', async () => {
      const mockUser = {
        seq_id: 1,
        nick_name: 'Test',
        email: 'test@test.com',
        invitation_code: 'ABC123',
      };
      PortalUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await UserService.getUserById(1, { invitation_code: true });

      expect(result).toEqual({ invitation_code: 'ABC123' });
    });
  });

  describe('getAllUsers()', () => {
    it('should call PortalUserModel.find()', async () => {
      const mockUsers = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
      PortalUserModel.countDocuments.mockResolvedValue(2);
      PortalUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockUsers),
              }),
            }),
          }),
        }),
      });

      const result = await UserService.getAllUsers();

      expect(PortalUserModel.find).toHaveBeenCalled();
      expect(result.list).toEqual(mockUsers);
      expect(result.total).toBe(2);
    });
  });

  describe('deleteUser()', () => {
    it('should soft delete user by setting is_deleted to true', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        seq_id: 1,
        is_deleted: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PortalUserModel.findOne.mockResolvedValue(mockUser);

      const result = await UserService.deleteUser(1, 'user123');

      expect(mockUser.is_deleted).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ seq_id: 1 });
    });

    it('should throw PORTAL_USER_NOT_FOUND when user does not exist', async () => {
      PortalUserModel.findOne.mockResolvedValue(null);

      await expect(UserService.deleteUser(999, 'user123')).rejects.toThrow(CustomError);
    });

    it('should throw COMMON_ACCESS_FORBIDDEN when deleting another user', async () => {
      const mockUser = {
        _id: { toString: () => 'user123' },
        seq_id: 1,
      };
      PortalUserModel.findOne.mockResolvedValue(mockUser);

      await expect(UserService.deleteUser(1, 'differentUser')).rejects.toThrow(CustomError);
    });
  });

  describe('getProfile()', () => {
    it('should return user with ref_code generated from seq_id', async () => {
      const mockUser = { _id: 'user123', seq_id: 42, email: 'test@test.com' };
      PortalUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      });
      hashidsEncode.mockReturnValue('ABC123');

      const result = await UserService.getProfile('user123');

      expect(result.ref_code).toBe('ABC123');
      expect(hashidsEncode).toHaveBeenCalledWith(42);
    });

    it('should throw PORTAL_USER_NOT_FOUND when user does not exist', async () => {
      PortalUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(UserService.getProfile('nonexistent')).rejects.toThrow(CustomError);
    });

    it('should include inviter_email when inviter exists', async () => {
      const mockUser = { _id: 'user123', seq_id: 1, inviter: 'inviter456' };
      const mockInviter = { email: 'inviter@test.com' };
      PortalUserModel.findById
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUser),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockInviter),
          }),
        });
      hashidsEncode.mockReturnValue('XYZ');

      const result = await UserService.getProfile('user123');

      expect(result.inviter_email).toBe('inviter@test.com');
    });
  });

  describe('getInviteList()', () => {
    it('should return paginated list of invited users', async () => {
      const mockList = [{ email: 'invited1@test.com', nick_name: 'User1', created_at: new Date() }];
      PortalUserModel.countDocuments.mockResolvedValue(1);
      PortalUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockList),
              }),
            }),
          }),
        }),
      });

      const result = await UserService.getInviteList('user123', {
        pageNumber: 1,
        pageSize: 20,
      });

      expect(result.list).toEqual(mockList);
      expect(result.total).toBe(1);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return empty list when no invitations exist', async () => {
      PortalUserModel.countDocuments.mockResolvedValue(0);
      PortalUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      const result = await UserService.getInviteList('user123');

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
