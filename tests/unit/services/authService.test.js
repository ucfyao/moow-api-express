jest.mock('../../../app/models/portalTokenModel');
jest.mock('../../../app/models/portalUserModel');
jest.mock('../../../app/models/portalEmailInfoModel');
jest.mock('../../../app/services/userService');
jest.mock('../../../app/services/sequenceService');
jest.mock('../../../app/services/emailService');
jest.mock('../../../app/utils/hashidsHandler');

const PortalTokenModel = require('../../../app/models/portalTokenModel');
const PortalUserModel = require('../../../app/models/portalUserModel');
const UserService = require('../../../app/services/userService');
const SequenceService = require('../../../app/services/sequenceService');
const EmailService = require('../../../app/services/emailService');
const { hashidsEncode, hashidsDecode } = require('../../../app/utils/hashidsHandler');
const AuthService = require('../../../app/services/authService');
const CustomError = require('../../../app/utils/customError');
const { STATUS_TYPE } = require('../../../app/utils/statusCodes');

describe('AuthService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('captchaIsValid()', () => {
    it('should return true for "888" in local environment', async () => {
      const result = await AuthService.captchaIsValid('888', 'anything', 'local');
      expect(result).toBe(true);
    });

    it('should return false for wrong captcha in non-local environment', async () => {
      const result = await AuthService.captchaIsValid('wrong', 'correct', 'production');
      expect(result).toBe(false);
    });

    it('should return true when captcha matches session captcha', async () => {
      const result = await AuthService.captchaIsValid('abc123', 'abc123', 'production');
      expect(result).toBe(true);
    });

    it('should not bypass in production even with "888"', async () => {
      const result = await AuthService.captchaIsValid('888', 'real-captcha', 'production');
      expect(result).toBe(false);
    });
  });

  describe('signUp()', () => {
    beforeEach(() => {
      // Default: captcha bypass in local env
      jest.spyOn(AuthService, 'captchaIsValid').mockResolvedValue(true);
      PortalUserModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      UserService.generatePassword.mockResolvedValue({
        salt: 'test-salt',
        password: 'hashed-password',
      });
      SequenceService.getNextSequenceValue.mockResolvedValue(1);
      hashidsEncode.mockReturnValue('HASH1');

      // Mock the constructor and save
      const mockSave = jest.fn().mockImplementation(function save() {
        return Promise.resolve(this);
      });
      PortalUserModel.mockImplementation((data) => ({
        ...data,
        _id: 'new-user-id',
        save: mockSave,
      }));

      // Mock sendActivateEmail
      jest.spyOn(AuthService, 'sendActivateEmail').mockResolvedValue({});
    });

    it('should throw when captcha is invalid', async () => {
      AuthService.captchaIsValid.mockResolvedValue(false);

      await expect(
        AuthService.signUp('Test', 'test@test.com', 'pass123', '', 'bad', 'good', '127.0.0.1')
      ).rejects.toThrow();
    });

    it('should throw when email is already registered', async () => {
      PortalUserModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ email: 'test@test.com' }),
      });

      await expect(
        AuthService.signUp('Test', 'test@test.com', 'pass123', '', '888', '888', '127.0.0.1')
      ).rejects.toThrow();
    });

    it('should throw for invalid invitation code', async () => {
      PortalUserModel.findOne
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) }) // no existing user
        .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) }); // no ref user

      hashidsDecode.mockReturnValue(999);

      await expect(
        AuthService.signUp('Test', 'new@test.com', 'pass123', 'BADCODE', '888', '888', '127.0.0.1')
      ).rejects.toThrow();
    });

    it('should create user successfully without ref code', async () => {
      const result = await AuthService.signUp(
        'Test',
        'new@test.com',
        'pass123',
        '',
        '888',
        '888',
        '127.0.0.1'
      );

      expect(UserService.generatePassword).toHaveBeenCalledWith('pass123');
      expect(SequenceService.getNextSequenceValue).toHaveBeenCalledWith('portal_user');
      expect(AuthService.sendActivateEmail).toHaveBeenCalledWith('new@test.com', '127.0.0.1');
      expect(result).toBeDefined();
    });
  });

  describe('signin()', () => {
    beforeEach(() => {
      jest.spyOn(AuthService, 'captchaIsValid').mockResolvedValue(true);
    });

    it('should throw when user not found', async () => {
      PortalUserModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      await expect(
        AuthService.signin({ email: 'none@test.com', password: 'pass' }, '127.0.0.1', '888', '888')
      ).rejects.toThrow();
    });

    it('should throw when password is incorrect', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        password: 'hashed',
        salt: 'salt',
        nick_name: 'Test',
      };
      PortalUserModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
      jest.spyOn(AuthService, '_verifyPassword').mockResolvedValue(false);

      await expect(
        AuthService.signin({ email: 'test@test.com', password: 'wrong' }, '127.0.0.1', '888', '888')
      ).rejects.toThrow('Incorrect password');
    });

    it('should return token and user info on success', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        password: 'hashed',
        salt: 'salt',
        nick_name: 'Test',
        real_name: 'Test User',
        mobile: '1234',
        is_activated: true,
        vip_time_out_at: new Date(),
        XBT: '100',
        seq_id: 1,
      };
      PortalUserModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUser) });
      PortalTokenModel.deleteMany.mockResolvedValue({});
      jest.spyOn(AuthService, '_verifyPassword').mockResolvedValue(true);

      // Mock _getToken
      jest.spyOn(AuthService, '_getToken').mockResolvedValue('new-session-token');

      const result = await AuthService.signin(
        { email: 'test@test.com', password: 'correct' },
        '127.0.0.1',
        '888',
        '888'
      );

      expect(result.token).toBe('new-session-token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('signout()', () => {
    it('should delete token when provided', async () => {
      PortalTokenModel.findOneAndDelete.mockResolvedValue({});

      await AuthService.signout('some-token');

      expect(PortalTokenModel.findOneAndDelete).toHaveBeenCalledWith({ token: 'some-token' });
    });

    it('should do nothing when no token provided', async () => {
      await AuthService.signout(null);

      expect(PortalTokenModel.findOneAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword()', () => {
    it('should throw when token not found', async () => {
      PortalTokenModel.findOne.mockResolvedValue(null);

      await expect(AuthService.resetPassword('newpass', 'bad-token')).rejects.toThrow();
    });

    it('should throw when token is expired', async () => {
      const expiredToken = {
        _id: 'token-id',
        user_id: 'user-id',
        last_access_time: new Date(Date.now() - 2000 * 1000), // 2000s ago, timeout is 1000s
      };
      PortalTokenModel.findOne.mockResolvedValue(expiredToken);
      PortalTokenModel.deleteOne.mockResolvedValue({});

      await expect(AuthService.resetPassword('newpass', 'expired-token')).rejects.toThrow();
    });

    it('should update password successfully', async () => {
      const tokenDoc = {
        _id: 'token-id',
        user_id: 'user-id',
        last_access_time: new Date(), // fresh token
      };
      const mockUser = {
        _id: 'user-id',
        password: 'old-hash',
        salt: 'old-salt',
        save: jest.fn().mockResolvedValue(true),
      };
      PortalTokenModel.findOne.mockResolvedValue(tokenDoc);
      PortalUserModel.findById.mockResolvedValue(mockUser);
      UserService.generatePassword.mockResolvedValue({
        salt: 'new-salt',
        password: 'new-hash',
      });
      PortalTokenModel.deleteOne.mockResolvedValue({});

      const result = await AuthService.resetPassword('newpass123', 'valid-token');

      expect(UserService.generatePassword).toHaveBeenCalledWith('newpass123');
      expect(mockUser.password).toBe('new-hash');
      expect(mockUser.salt).toBe('new-salt');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.message).toBe('Password reset successfully');
    });
  });

  describe('_verifyPassword()', () => {
    it('should return true for matching password', async () => {
      const password = 'test-password';
      const salt = 'test-salt-123';
      const hash = require('crypto')
        .pbkdf2Sync(password, salt, 1000, 32, 'sha512')
        .toString('base64');

      const result = await AuthService._verifyPassword(password, salt, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const result = await AuthService._verifyPassword('wrong', 'salt', 'wronghash');
      expect(result).toBe(false);
    });
  });

  describe('getLoginfoByToken()', () => {
    it('should query token model', async () => {
      const mockToken = { token: 'abc', user_id: 'user-1' };
      PortalTokenModel.findOne.mockResolvedValue(mockToken);

      const result = await AuthService.getLoginfoByToken('abc');

      expect(PortalTokenModel.findOne).toHaveBeenCalledWith({ token: 'abc' });
      expect(result).toEqual(mockToken);
    });
  });

  describe('modifyAccessTime()', () => {
    it('should update last_access_time and save', async () => {
      const loginInfo = {
        last_access_time: null,
        save: jest.fn().mockResolvedValue(true),
      };

      const result = await AuthService.modifyAccessTime(loginInfo);

      expect(loginInfo.last_access_time).toBeDefined();
      expect(loginInfo.save).toHaveBeenCalled();
      expect(result).toBe(loginInfo);
    });
  });
});
