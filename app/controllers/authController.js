const svgCaptcha = require('svg-captcha');
const AuthService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');
const CustomError = require('../utils/customError');

class AuthController {
  
  // Generates a captcha image and returns it in the response.
  async getCaptcha(req, res) {
    // Extract query parameters or use default values for captcha configuration
    const {
      width = 150,
      height = 36,
      fontSize = 50,
      backgroundColor = '#f5f5f5',
    } = req.query || {};

    // Set captcha options
    svgCaptcha.options.width = width;
    svgCaptcha.options.height = height;
    svgCaptcha.options.fontSize = fontSize;

    // Create a math expression captcha
    const captcha = svgCaptcha.createMathExpr({
      size: 4, // Length of the captcha
      ignoreChars: '0o1i', // Characters to exclude from the captcha
      noise: 3, // Number of noise lines
      color: true, // Whether the captcha characters have color (default: no color)
      background: backgroundColor, // Background color of the captcha image
    });

    // Store the captcha text in the session for later verification
    req.session.captcha = captcha.text;

    // Set the response content type to SVG and send the captcha image
    res.type('image/svg+xml');
    res.send(captcha.data);
  }

  async signin(req, res) {
    const { captcha, ...loginInfo } = req.body;
    const userIp = req.ip;

    // Verify captcha
    if (
      !AuthService.captchaIsValid(
        captcha,
        req.session.captcha,
        process.env.NODE_ENV
      )
    ) {
      return ResponseHandler.fail(
        res,
        STATUS_TYPE.badRequest,
        STATUS_TYPE.validationError,
        "Invalid captcha"
      );
    }
    // Perform sign-in
    const userInfo = await AuthService.signin(loginInfo, userIp);
    ResponseHandler.success(res, userInfo);
  }

  // user logout
  async exit(req, res) {
    const token = req.headers['token'];
    await AuthService.exit(token);
    ResponseHandler.success(res);
  }

  async resetPassword(req, res) {
    const newPassword = req.body.new_password;
    const token = req.body.token;
    const resMessage = await AuthService.resetPassword(newPassword, token);
    return ResponseHandler.success(res, resMessage);
  }

  // send activate email to new user
  async sendActivateEmail(req, res) {
    const userId = req.body.user_id || req.headers['user_id']; // user_id is the _id in user model
    const userIp = req.ip;
    // HELP: 是否添加一个异常处理 如果没有获取到userId字段
    if (!userId) {
      return ResponseHandler.fail(
        res,
        STATUS_TYPE.badRequest,
        STATUS_TYPE.COMMON_PARAMS_ERROR,
        "User id is needed."
        );
    }
    const result = await AuthService.sendActivateEmail(userId, userIp);
    return res.send(result.html);
  }
}

module.exports = new AuthController();
