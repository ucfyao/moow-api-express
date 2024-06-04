const _ = require("lodash");
const ResponseHandler = require("../utils/responseHandler");
const { STATUS_TYPE } = require("../utils/statusCodes");
const AuthService = require("../services/authService");

const authMiddleware = async (req, res, next) => {
  // In non-production environments, if needToken = false, do not validate the token
  /*
  if (config.env !== 'prod' && !config.needToken) {
    console.log(2)
    return next();
  }
  */

  const currentPath = _.trimEnd(req.path, "/");
  const token = req.headers["token"];
  const userId = req.headers["user_id"];

  // Check if token information is complete
  if (!currentPath || !token || !userId) {
    ResponseHandler.fail(res, STATUS_TYPE.unauthorized, STATUS_TYPE.tokenIllegal);
    return;
  }

  // Look for the corresponding document from tokenModel
  let loginInfoObj = await AuthService.getLoginfoByToken(token);

  // Check if the document exists
  if (!loginInfoObj) {
    ResponseHandler.fail(res, STATUS_TYPE.unauthorized, STATUS_TYPE.tokenIllegal);
    return;
  }

  // Check if the token has expired
  if ((+new Date() - loginInfoObj.last_access_time) / 1000 > 100000) {
    await AuthService.deleteToken(loginInfoObj);
    ResponseHandler.fail(res, STATUS_TYPE.unauthorized, STATUS_TYPE.tokenExpired);
    return;
  }

  // Check if the userId matches the user_id recorded in loginInfoObj
  if (loginInfoObj.user_id.toString() !== userId) {
    ResponseHandler.fail(res, STATUS_TYPE.unauthorized, STATUS_TYPE.tokenIllegal);
    return;
  }

  // Update the latest access time of loginInfoObj
  loginInfoObj.last_access_time = +new Date();
  await AuthService.modifyAccessTime(loginInfoObj);
  // req.userId = userId;
  next();
};

module.exports = authMiddleware;
