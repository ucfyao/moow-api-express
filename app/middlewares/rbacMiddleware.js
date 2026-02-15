const AuthService = require('../services/authService');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

const requirePermission = (resourceCode) => async (req, _res, next) => {
  const { userId } = req;
  if (!userId) {
    throw new CustomError(STATUS_TYPE.HTTP_UNAUTHORIZED, 401, 'Authentication required');
  }

  const permission = await AuthService.getUserPermission(userId);

  if (!permission.role) {
    throw new CustomError(STATUS_TYPE.COMMON_ACCESS_FORBIDDEN, 403, 'Access forbidden');
  }

  // Admin role bypasses all permission checks
  if (permission.role.role_name === 'admin') {
    return next();
  }

  const hasPermission = permission.resources.some((r) => r.resource_code === resourceCode);
  if (!hasPermission) {
    throw new CustomError(STATUS_TYPE.COMMON_ACCESS_FORBIDDEN, 403, 'Access forbidden');
  }

  return next();
};

module.exports = { requirePermission };
