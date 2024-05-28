const svgCaptcha = require("svg-captcha");
const ResponseHandler = require("../utils/responseHandler");
const { STATUS_TYPE } = require("../constants/statusCodes");

class AuthController {
  async getCaptcha(req, res) {
    try {
      const {
        width = 150,
        height = 36,
        fontSize = 50,
        backgroundColor = "#f5f5f5",
      } = req.query || {};
      svgCaptcha.options.width = width;
      svgCaptcha.options.height = height;
      svgCaptcha.options.fontSize = fontSize;

      const captcha = svgCaptcha.createMathExpr({
        size: 4, // Length of the captcha
        ignoreChars: "0o1i", // Characters to exclude from the captcha
        noise: 3, // Number of noise lines
        color: true, // Whether the captcha characters have color (default: no color)
        background: backgroundColor, // Background color of the captcha image
      });

      // console.log(1)

      // Ensure the session is properly initialized
      if (!req.session) {
        throw new Error('Session is not initialized');
      }

      req.session.captcha = captcha.text;
      // console.log(2)
      console.log(captcha.text);

      res.type("image/svg+xml");
      res.send(captcha.data);
    } catch (error) {
      ResponseHandler.fail(
        res,
        STATUS_TYPE.internalServerError,
        STATUS_TYPE.internalError,
        error.message
      );
    }
  }
}

module.exports = new AuthController();