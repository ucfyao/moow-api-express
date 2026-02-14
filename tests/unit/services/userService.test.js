const crypto = require('crypto');

// Mock the PortalUserModel before requiring the service
jest.mock('../../../app/models/portalUserModel');
const PortalUserModel = require('../../../app/models/portalUserModel');
const UserService = require('../../../app/services/userService');

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
});
