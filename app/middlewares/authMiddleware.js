const authMiddleware = (req, res, next) => {
    // 这里实现认证逻辑
    next();
};

module.exports = authMiddleware;

