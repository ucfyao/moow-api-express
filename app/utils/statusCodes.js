/**
 * Optimization points for status code design:
 * 1. Range allocation: Assign a specific range of status codes for each module to avoid conflicts.
 * 2. Module prefix: Add module prefixes to the status code constants to distinguish them easily.
 * 3. Comment description: Add comment descriptions after each status code to clearly explain the purpose of each code.
 * 4. Use computed property names: Use computed property names in STATUS_MESSAGE_ZH and STATUS_MESSAGE objects to avoid hard-coding duplicate status codes.
 *
 * Custom business code segments:
 * - global: 1 ~ 1000
 * - common: 1001 ~ 10000
 * - portal: 11001 ~ 12000
 * - aip: 12001 ~ 13000
 * - data: 13001 ~ 14000
 * - asset: 14001 ~ 15000
 */

const STATUS_TYPE = {
    // Global status codes (1-1000)
    GLOBAL_SUCCESS: 0, // Global success
    GLOBAL_INTERNAL_ERROR: 1, // Global internal error
    GLOBAL_OTHER_ERROR: 2, // Global other error

    // HTTP status codes
    HTTP_OK: 200, // Successful request
    HTTP_CREATED: 201, // Resource created
    HTTP_ACCEPTED: 202, // Request accepted
    HTTP_NO_CONTENT: 204, // No content
    HTTP_BAD_REQUEST: 400, // Bad request
    HTTP_UNAUTHORIZED: 401, // Unauthorized
    HTTP_FORBIDDEN: 403, // Forbidden access
    HTTP_NOT_FOUND: 404, // Resource not found
    HTTP_METHOD_NOT_ALLOWED: 405, // Method not allowed
    HTTP_CONFLICT: 409, // Resource conflict
    HTTP_INTERNAL_SERVER_ERROR: 500, // Internal server error
    HTTP_BAD_GATEWAY: 502, // Bad gateway
    HTTP_SERVICE_UNAVAILABLE: 503, // Service unavailable
    HTTP_GATEWAY_TIMEOUT: 504, // Gateway timeout

    // Custom status codes for common module (1001-10000)
    COMMON_SERVER_BUSY: 1001, // Server is busy
    COMMON_SERVICE_UNAVAILABLE: 1002, // Service is unavailable
    COMMON_POST_ONLY: 1003, // POST requests only
    COMMON_PARAMS_ERROR: 1004, // Invalid parameters
    COMMON_ACCESS_FORBIDDEN: 1005, // Access forbidden

    // Custom status codes for portal module (11001-12000)
    PORTAL_TOKEN_ILLEGAL: 11001, // Session timeout or illegal token
    PORTAL_TOKEN_EXPIRED: 11002, // Session timeout
    PORTAL_NOT_ACTIVATED: 11003, // Account not activated
    PORTAL_ACTIVATE_CODE_ILLEGAL: 11004, // Invalid activation code
    PORTAL_ACTIVATE_CODE_EXPIRED: 11005, // Activation code expired
    PORTAL_VIP_MEMBER_EXPIRED: 11006, // VIP membership expired
    PORTAL_EMAIL_ALREADY_REGISTERED: 11007, // Email already registered
    PORTAL_INVALID_INVITATION_CODE: 11008, // Invalid invitation code
    PORTAL_REGISTRATION_FAILED: 11009, // Registration failed
    PORTAL_USER_NOT_FOUND: 11010, // Uer not found
    PORTAL_INCORRECT_PASSWORD: 11011, // Password incorrect
    PORTAL_UPDATE_FAILED: 11012, // Update user information failed/


    // Custom status codes for aip module (12001-13000)
    AIP_SERVER_BUSY: 12001, // Trading module server is busy
    AIP_SERVICE_UNAVAILABLE: 12002, // Trading module service is unavailable
    AIP_POST_ONLY: 12003, // Trading module POST requests only
    AIP_PARAMS_ERROR: 12004, // Trading module invalid parameters
    AIP_ACCESS_FORBIDDEN: 12005, // Trading module access forbidden

    // Custom status codes for data module (13001-14000)
    DATA_SERVER_BUSY: 13001, // Data module server is busy
    DATA_SERVICE_UNAVAILABLE: 13002, // Data module service is unavailable
    DATA_POST_ONLY: 13003, // Data module POST requests only
    DATA_PARAMS_ERROR: 13004, // Data module invalid parameters
    DATA_ACCESS_FORBIDDEN: 13005, // Data module access forbidden

    // Custom status codes for asset module (14001-15000)
    ASSET_SERVER_BUSY: 14001, // Asset module server is busy
    ASSET_SERVICE_UNAVAILABLE: 14002, // Asset module service is unavailable
    ASSET_POST_ONLY: 14003, // Asset module POST requests only
    ASSET_PARAMS_ERROR: 14004, // Asset module invalid parameters
    ASSET_ACCESS_FORBIDDEN: 14005, // Asset module access forbidden
};

const STATUS_MESSAGE_ZH = {
    [STATUS_TYPE.GLOBAL_SUCCESS]: '成功',
    [STATUS_TYPE.GLOBAL_INTERNAL_ERROR]: '服务器内部错误',
    [STATUS_TYPE.GLOBAL_OTHER_ERROR]: '其他错误',

    // HTTP status messages in Chinese
    [STATUS_TYPE.HTTP_OK]: '成功',
    [STATUS_TYPE.HTTP_CREATED]: '已创建',
    [STATUS_TYPE.HTTP_ACCEPTED]: '已接受',
    [STATUS_TYPE.HTTP_NO_CONTENT]: '无内容',
    [STATUS_TYPE.HTTP_BAD_REQUEST]: '错误请求',
    [STATUS_TYPE.HTTP_UNAUTHORIZED]: '未授权',
    [STATUS_TYPE.HTTP_FORBIDDEN]: '禁止访问',
    [STATUS_TYPE.HTTP_NOT_FOUND]: '未找到',
    [STATUS_TYPE.HTTP_METHOD_NOT_ALLOWED]: '方法不允许',
    [STATUS_TYPE.HTTP_CONFLICT]: '冲突',
    [STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR]: '内部服务器错误',
    [STATUS_TYPE.HTTP_BAD_GATEWAY]: '错误网关',
    [STATUS_TYPE.HTTP_SERVICE_UNAVAILABLE]: '服务不可用',
    [STATUS_TYPE.HTTP_GATEWAY_TIMEOUT]: '网关超时',

    // Common module messages
    [STATUS_TYPE.COMMON_SERVER_BUSY]: '服务器繁忙',
    [STATUS_TYPE.COMMON_SERVICE_UNAVAILABLE]: '服务不可用',
    [STATUS_TYPE.COMMON_POST_ONLY]: '仅支持POST请求',
    [STATUS_TYPE.COMMON_PARAMS_ERROR]: '参数错误',
    [STATUS_TYPE.COMMON_ACCESS_FORBIDDEN]: '禁止访问',

    // Portal module messages
    [STATUS_TYPE.PORTAL_TOKEN_ILLEGAL]: '会话超时或非法',
    [STATUS_TYPE.PORTAL_TOKEN_EXPIRED]: '会话超时',
    [STATUS_TYPE.PORTAL_NOT_ACTIVATED]: '账号未激活',
    [STATUS_TYPE.PORTAL_ACTIVATE_CODE_ILLEGAL]: '激活码非法',
    [STATUS_TYPE.PORTAL_ACTIVATE_CODE_EXPIRED]: '激活码已过期',
    [STATUS_TYPE.PORTAL_VIP_MEMBER_EXPIRED]: 'VIP会员已过期',
    [STATUS_TYPE.PORTAL_EMAIL_ALREADY_REGISTERED]: '邮箱已被注册',
    [STATUS_TYPE.PORTAL_INVALID_INVITATION_CODE]: '无效的邀请代码',
    [STATUS_TYPE.PORTAL_REGISTRATION_FAILED]: '注册失败，请重试',
    [STATUS_TYPE.PORTAL_USER_NOT_FOUND]: '用户未找到',
    [STATUS_TYPE.PORTAL_INCORRECT_PASSWORD]: '用户密码错误',
    [STATUS_TYPE.PORTAL_UPDATE_FAILED]: '用户信息更新失败',

    // AIP module messages
    [STATUS_TYPE.AIP_SERVER_BUSY]: '交易模块服务器繁忙',
    [STATUS_TYPE.AIP_SERVICE_UNAVAILABLE]: '交易模块服务不可用',
    [STATUS_TYPE.AIP_POST_ONLY]: '交易模块仅支持POST请求',
    [STATUS_TYPE.AIP_PARAMS_ERROR]: '交易模块参数错误',
    [STATUS_TYPE.AIP_ACCESS_FORBIDDEN]: '交易模块禁止访问',

    // Data module messages
    [STATUS_TYPE.DATA_SERVER_BUSY]: '数据模块服务器繁忙',
    [STATUS_TYPE.DATA_SERVICE_UNAVAILABLE]: '数据模块服务不可用',
    [STATUS_TYPE.DATA_POST_ONLY]: '数据模块仅支持POST请求',
    [STATUS_TYPE.DATA_PARAMS_ERROR]: '数据模块参数错误',
    [STATUS_TYPE.DATA_ACCESS_FORBIDDEN]: '数据模块禁止访问',

    // Asset module messages
    [STATUS_TYPE.ASSET_SERVER_BUSY]: '资产模块服务器繁忙',
    [STATUS_TYPE.ASSET_SERVICE_UNAVAILABLE]: '资产模块服务不可用',
    [STATUS_TYPE.ASSET_POST_ONLY]: '资产模块仅支持POST请求',
    [STATUS_TYPE.ASSET_PARAMS_ERROR]: '资产模块参数错误',
    [STATUS_TYPE.ASSET_ACCESS_FORBIDDEN]: '资产模块禁止访问',
};

const STATUS_MESSAGE = {
    [STATUS_TYPE.GLOBAL_SUCCESS]: 'Success',
    [STATUS_TYPE.GLOBAL_INTERNAL_ERROR]: 'Internal server error',
    [STATUS_TYPE.GLOBAL_OTHER_ERROR]: 'Other error',

    // HTTP status messages in English
    [STATUS_TYPE.HTTP_OK]: 'OK',
    [STATUS_TYPE.HTTP_CREATED]: 'Created',
    [STATUS_TYPE.HTTP_ACCEPTED]: 'Accepted',
    [STATUS_TYPE.HTTP_NO_CONTENT]: 'No Content',
    [STATUS_TYPE.HTTP_BAD_REQUEST]: 'Bad Request',
    [STATUS_TYPE.HTTP_UNAUTHORIZED]: 'Unauthorized',
    [STATUS_TYPE.HTTP_FORBIDDEN]: 'Forbidden',
    [STATUS_TYPE.HTTP_NOT_FOUND]: 'Not Found',
    [STATUS_TYPE.HTTP_METHOD_NOT_ALLOWED]: 'Method Not Allowed',
    [STATUS_TYPE.HTTP_CONFLICT]: 'Conflict',
    [STATUS_TYPE.HTTP_INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    [STATUS_TYPE.HTTP_BAD_GATEWAY]: 'Bad Gateway',
    [STATUS_TYPE.HTTP_SERVICE_UNAVAILABLE]: 'Service Unavailable',
    [STATUS_TYPE.HTTP_GATEWAY_TIMEOUT]: 'Gateway Timeout',

    // Common module messages
    [STATUS_TYPE.COMMON_SERVER_BUSY]: 'Server is busy',
    [STATUS_TYPE.COMMON_SERVICE_UNAVAILABLE]: 'Service is unavailable',
    [STATUS_TYPE.COMMON_POST_ONLY]: 'POST requests only',
    [STATUS_TYPE.COMMON_PARAMS_ERROR]: 'Invalid parameters',
    [STATUS_TYPE.COMMON_ACCESS_FORBIDDEN]: 'Access forbidden',

    // Portal module messages
    [STATUS_TYPE.PORTAL_TOKEN_ILLEGAL]: 'Session timeout or illegal token',
    [STATUS_TYPE.PORTAL_TOKEN_EXPIRED]: 'Session timeout',
    [STATUS_TYPE.PORTAL_NOT_ACTIVATED]: 'Account not activated',
    [STATUS_TYPE.PORTAL_ACTIVATE_CODE_ILLEGAL]: 'Invalid activation code',
    [STATUS_TYPE.PORTAL_ACTIVATE_CODE_EXPIRED]: 'Activation code expired',
    [STATUS_TYPE.PORTAL_VIP_MEMBER_EXPIRED]: 'VIP membership expired',
    [STATUS_TYPE.PORTAL_EMAIL_ALREADY_REGISTERED]: 'The email is already registered',
    [STATUS_TYPE.PORTAL_INVALID_INVITATION_CODE]: 'Invalid invitation code',
    [STATUS_TYPE.PORTAL_REGISTRATION_FAILED]: 'Failed to register, please try again',
    [STATUS_TYPE.PORTAL_USER_NOT_FOUND]: 'User not found',
    [STATUS_TYPE.PORTAL_INCORRECT_PASSWORD]: 'Incorrect password',
    [STATUS_TYPE.PORTAL_UPDATE_FAILED]: 'Update user information failed',

    // AIP module messages
    [STATUS_TYPE.AIP_SERVER_BUSY]: 'Trading module server is busy',
    [STATUS_TYPE.AIP_SERVICE_UNAVAILABLE]: 'Trading module service is unavailable',
    [STATUS_TYPE.AIP_POST_ONLY]: 'Trading module POST requests only',
    [STATUS_TYPE.AIP_PARAMS_ERROR]: 'Trading module invalid parameters',
    [STATUS_TYPE.AIP_ACCESS_FORBIDDEN]: 'Trading module access forbidden',

    // Data module messages
    [STATUS_TYPE.DATA_SERVER_BUSY]: 'Data module server is busy',
    [STATUS_TYPE.DATA_SERVICE_UNAVAILABLE]: 'Data module service is unavailable',
    [STATUS_TYPE.DATA_POST_ONLY]: 'Data module POST requests only',
    [STATUS_TYPE.DATA_PARAMS_ERROR]: 'Data module invalid parameters',
    [STATUS_TYPE.DATA_ACCESS_FORBIDDEN]: 'Data module access forbidden',

    // Asset module messages
    [STATUS_TYPE.ASSET_SERVER_BUSY]: 'Asset module server is busy',
    [STATUS_TYPE.ASSET_SERVICE_UNAVAILABLE]: 'Asset module service is unavailable',
    [STATUS_TYPE.ASSET_POST_ONLY]: 'Asset module POST requests only',
    [STATUS_TYPE.ASSET_PARAMS_ERROR]: 'Asset module invalid parameters',
    [STATUS_TYPE.ASSET_ACCESS_FORBIDDEN]: 'Asset module access forbidden',
};

module.exports = { STATUS_TYPE, STATUS_MESSAGE, STATUS_MESSAGE_ZH };