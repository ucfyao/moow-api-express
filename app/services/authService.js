const _ = require('lodash');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');
const User = require('../models/userModel');
const PortalTokenModel = require('../models/tokenModel');
const PortalUserModel = require('../models/userModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const UserService = require('./userService')
const config = require('../../config')
const EmailService = require('./emailService');
const ejs = require('ejs');

class AuthService {
  // verify captcha
  async captchaIsValid(text, sessionCaptcha, env) {
    if (env === "local" && text === "888") {
      return true;
    }
    return sessionCaptcha === text;
  }

  // user login
  async signin(loginInfo, userIp) {
    const start = Date.now();
    const oUser = await User.findOne({ email: loginInfo.email }).lean();

    if (!oUser) {
      throw new Error("User does not exist");
    }

    const isPasswordCorrect = await this._verifyPassword(
      loginInfo.password,
      oUser.salt,
      oUser.password
    );

    if (!isPasswordCorrect) {
      throw new Error("Incorrect password");
    }

    await PortalTokenModel.deleteMany({ user_id: oUser._id, type: "session" });

    const token = await this._getToken(oUser, userIp);
    const userInfo = _.pick(oUser, [
      "_id",
      "real_name",
      "nick_name",
      "mobile",
      "email",
      "is_activated",
      "vip_time_out_at",
      "XBT",
      "seq_id",
    ]);

    const info = {
      token,
      user: userInfo,
    };

    return info;
  }

  // user logout
  async exit(token) {
    if (token) {
      await PortalTokenModel.findOneAndDelete({ token });
    }
  }

  async getLoginfoByToken(token) {
    let tokenObj = await PortalTokenModel.findOne({ token: token });
    return tokenObj;
  }

  async deleteToken(loginInfoObj) {
    await loginInfoObj.findOneAndDelete();
    return loginInfoObj; 
  }

  async modifyAccessTime(loginInfoObj) {
    loginInfoObj.last_access_time = Date.now();
    await loginInfoObj.save();
    return loginInfoObj;
  }

  async resetPassword(newPassword, token) {
    // reset password
    const tokenDoc = await PortalTokenModel.findOne({
      token: token,
      type: "code"
    });
    // If token not exist
    if (!tokenDoc) {
      throw new CustomError(STATUS_TYPE.PORTAL_ACTIVATE_CODE_ILLEGAL);
    }

    if ((+new Date() - tokenDoc.last_access_time) / 1000 > config.tokenTimeOut) {
      await PortalTokenModel.deleteOne({ _id: tokenDoc._id });
      throw new CustomError(STATUS_TYPE.PORTAL_ACTIVATE_CODE_EXPIRED);
    }

    // update password 
    const user = await PortalUserModel.findById(tokenDoc.user_id)
    const pwdObj = await UserService.generatePassword(newPassword);
    user.password = pwdObj.password;
    user.salt = pwdObj.salt;
    await user.save()
      
    // remove token
    await PortalTokenModel.deleteOne({ _id: tokenDoc._id });

    return {
      message: 'Password reset successfully',
    };
  }

  async sendActivateEmail(userId, userIp) {
    const oUser = await PortalUserModel.findById(userId).lean();
    if (!oUser) {
      throw CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }
    if (oUser.is_activated) {
      throw CustomError(STATUS_TYPE.PORTAL_USER_ALREADY_ACTIVATED);
    }
    // generate Token
    const code = await this._getCode(oUser, userIp);
    const siteName = config.siteName;
    const siteUrl = config.siteUrl;
    const activateUrl = `${siteUrl}/active-confirm/${code}`;
    const displayName = oUser.nick_name || oUser.email;
    const html = await ejs.renderFile('./app/views/welcome_mail.html', { siteName, displayName, activateUrl, siteUrl });
    const activeEmail = {
      async: false, 
      to: [oUser.email],
      subject: `Welcome to Register at ${siteName}`,
      text: `Hello ${displayName}, welcome to register. Please click the following link to activate your account: ${activateUrl}`,
      html,
    };
    console.log(activeEmail);

    // 下单后需要进行一次核对，且不阻塞当前请求
    // HELP: runInBackground这个方法是在哪里定义的？
    // TODO: 终端问题的捕获 
    //ctx.runInBackground(async () => {
      // 这里面的异常都会统统被 Backgroud 捕获掉，并打印错误日志
      // 发送激活邮件
    //  await EmailService.sendEmail(activeEmail);
    //});
    await EmailService.sendEmail(activeEmail);
    return {
      html: html,
      message: '邮件已发送',
    };
  }

  async _verifyPassword(password, salt, encryptedPwd) {
    const iteration = 1000;
    const cryptoPassword = crypto.pbkdf2Sync(
      password,
      salt,
      iteration,
      32,
      "sha512"
    );
    return cryptoPassword.toString("base64") === encryptedPwd;
  }

  async _getToken(user, userIp) {
    const token = this._generateToken(user);
    this.userIp = userIp;
    await new PortalTokenModel({
      user_id: user._id,
      token,
      user_ip: userIp,
      email: user.email,
      nick_name: user.nick_name,
      type: "session",
      last_access_time: new Date(),
    }).save();
    return token;
  }

  _generateToken(user) {
    return uuidv1().replace(/-/g, "");
  }

  async _getCode(user, userIp) {
    const token = this._generateCode();
    await new PortalTokenModel({
      user_id: user._id,
      token,
      user_ip: userIp,
      email: user.email,
      nick_name: user.nick_name,
      type: 'code',
      last_access_time: +new Date(),
    }).save();
    return token;
  }

  _generateCode() {
    return uuidv1().replace(/-/g, '');
  }
}

module.exports = new AuthService();
