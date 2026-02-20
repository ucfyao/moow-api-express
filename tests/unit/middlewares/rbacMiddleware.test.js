jest.mock('../../../app/services/authService');

const AuthService = require('../../../app/services/authService');
const { requirePermission } = require('../../../app/middlewares/rbacMiddleware');
const CustomError = require('../../../app/utils/customError');

describe('rbacMiddleware - requirePermission', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      userId: '507f1f77bcf86cd799439011',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should throw 401 when userId is not set on req', async () => {
    req.userId = undefined;
    const middleware = requirePermission('admin_purchase');

    await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw 403 when user has no role', async () => {
    AuthService.getUserPermission.mockResolvedValue({
      role: null,
      resources: [],
    });
    const middleware = requirePermission('admin_purchase');

    await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when user has admin role (bypass)', async () => {
    AuthService.getUserPermission.mockResolvedValue({
      role: { _id: 'role-1', role_name: 'admin', role_description: 'Administrator' },
      resources: [],
    });
    const middleware = requirePermission('admin_purchase');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() when user has super_admin role (bypass)', async () => {
    AuthService.getUserPermission.mockResolvedValue({
      role: { _id: 'role-3', role_name: 'super_admin', role_description: 'Super Administrator' },
      resources: [],
    });
    const middleware = requirePermission('admin_purchase');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next() when user has the required resource_code', async () => {
    AuthService.getUserPermission.mockResolvedValue({
      role: { _id: 'role-2', role_name: 'editor', role_description: 'Editor' },
      resources: [
        { _id: 'res-1', resource_code: 'admin_purchase', resource_name: 'Purchases' },
        { _id: 'res-2', resource_code: 'admin_role', resource_name: 'Roles' },
      ],
    });
    const middleware = requirePermission('admin_purchase');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should throw 403 when user lacks the required resource_code', async () => {
    AuthService.getUserPermission.mockResolvedValue({
      role: { _id: 'role-2', role_name: 'editor', role_description: 'Editor' },
      resources: [{ _id: 'res-2', resource_code: 'admin_role', resource_name: 'Roles' }],
    });
    const middleware = requirePermission('admin_purchase');

    await expect(middleware(req, res, next)).rejects.toThrow(CustomError);
    expect(next).not.toHaveBeenCalled();
  });
});
