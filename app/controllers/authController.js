const svgCaptcha = require('svg-captcha');
const AuthService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class AuthController {

  // user sign up
  async signUp(req, res) {
    const { name, email, password, refCode, captcha } = req.body;
    const sessionCaptcha = req.session.captcha;
    const userIp = req.ip;
    const user = await AuthService.signUp(name, email, password, refCode, captcha, sessionCaptcha, userIp);
    return ResponseHandler.success(res, user, STATUS_TYPE.HTTP_CREATED);
  }

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
    const sessionCaptcha = req.session.captcha;
    const userIp = req.ip;
    // Perform sign-in
    const userInfo = await AuthService.signin(loginInfo, userIp, captcha, sessionCaptcha);
    ResponseHandler.success(res, userInfo);
  }

  // user logout
  async signout(req, res) {
    const token = req.headers['token'];
    await AuthService.signout(token);
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
    const userEmail = req.body.email; // user_id is the _id in user model
    const userIp = req.ip;
    const resMessage = await AuthService.sendActivateEmail(userEmail, userIp);
    return ResponseHandler.success(res, resMessage);
  }

  // activate email
  async activateUser(req, res) {
    const token = req.body.token;
    const resMessage = await AuthService.activateUser(token);
    return ResponseHandler.success(res, resMessage);
  }

  // send retrieve password email
  async sendRetrieveEmail(req, res) {
    const { userEmail, captcha } = req.body;
    const sessionCaptcha = req.session.captcha;
    const userIp = req.ip;
    const resMessage = await AuthService.sendRetrieveEmail(userEmail, userIp, captcha, sessionCaptcha);
    return ResponseHandler.success(res, resMessage);
  }
}

module.exports = new AuthController();
