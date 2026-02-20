const AuthService = require('../services/authService');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

// Admin roles that bypass all permission checks — frozen to prevent runtime mutation
const ADMIN_ROLES = Object.freeze(['admin', 'super_admin']);

const requirePermission = (resourceCode) => async (req, _res, next) => {
  const { userId } = req;
  if (!userId) {
    throw new CustomError(STATUS_TYPE.HTTP_UNAUTHORIZED, 401, 'Authentication required');
  }

  const permission = await AuthService.getUserPermission(userId);

  if (!permission.role) {
    throw new CustomError(STATUS_TYPE.COMMON_ACCESS_FORBIDDEN, 403, 'Access forbidden');
  }

  if (ADMIN_ROLES.includes(permission.role.role_name)) {
    return next();
  }

  const hasPermission = permission.resources.some((r) => r.resource_code === resourceCode);
  if (!hasPermission) {
    throw new CustomError(STATUS_TYPE.COMMON_ACCESS_FORBIDDEN, 403, 'Access forbidden');
  }

  return next();
};

module.exports = { requirePermission };
