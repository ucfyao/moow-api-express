const authMiddleware = require('../../../app/middlewares/authMiddleware');
const AuthService = require('../../../app/services/authService');
const ResponseHandler = require('../../../app/utils/responseHandler');

// Mock dependencies
jest.mock('../../../app/services/authService');
jest.mock('../../../app/utils/responseHandler');

describe('authMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      path: '/api/v1/strategies',
      headers: {
        token: 'valid-token-123',
        user_id: '507f1f77bcf86cd799439011',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  it('should return 401 when token header is missing', async () => {
    req.headers.token = undefined;

    await authMiddleware(req, res, next);

    expect(ResponseHandler.fail).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user_id header is missing', async () => {
    req.headers.user_id = undefined;

    await authMiddleware(req, res, next);

    expect(ResponseHandler.fail).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is not found in DB', async () => {
    AuthService.getLoginfoByToken.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(AuthService.getLoginfoByToken).toHaveBeenCalledWith('valid-token-123');
    expect(ResponseHandler.fail).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 and delete token when token has expired (>100000 seconds)', async () => {
    const expiredTime = Date.now() - 200000 * 1000; // well past 100000 seconds
    const loginInfo = {
      user_id: { toString: () => '507f1f77bcf86cd799439011' },
      last_access_time: expiredTime,
      findOneAndDelete: jest.fn(),
    };
    AuthService.getLoginfoByToken.mockResolvedValue(loginInfo);
    AuthService.deleteToken.mockResolvedValue(loginInfo);

    await authMiddleware(req, res, next);

    expect(AuthService.deleteToken).toHaveBeenCalledWith(loginInfo);
    expect(ResponseHandler.fail).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user_id does not match token record', async () => {
    const loginInfo = {
      user_id: { toString: () => 'different-user-id' },
      last_access_time: Date.now(),
    };
    AuthService.getLoginfoByToken.mockResolvedValue(loginInfo);

    await authMiddleware(req, res, next);

    expect(ResponseHandler.fail).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and update access time on valid token', async () => {
    const loginInfo = {
      user_id: { toString: () => '507f1f77bcf86cd799439011' },
      last_access_time: Date.now(),
    };
    AuthService.getLoginfoByToken.mockResolvedValue(loginInfo);
    AuthService.modifyAccessTime.mockResolvedValue(loginInfo);

    await authMiddleware(req, res, next);

    expect(AuthService.modifyAccessTime).toHaveBeenCalledWith(loginInfo);
    expect(next).toHaveBeenCalled();
    expect(ResponseHandler.fail).not.toHaveBeenCalled();
  });
});
