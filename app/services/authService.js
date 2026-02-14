const _ = require('lodash');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');
const ejs = require('ejs');
const path = require('path');
const dayjs = require('dayjs');
const PortalTokenModel = require('../models/portalTokenModel');
const PortalUserModel = require('../models/portalUserModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const UserService = require('./userService');
const SequenceService = require('./sequenceService');
const config = require('../../config');
const EmailService = require('./emailService');
const PortalEmailInfoModel = require('../models/portalEmailInfoModel');
const { hashidsEncode, hashidsDecode } = require('../utils/hashidsHandler');
const logger = require('../utils/logger');

class AuthService {
  // verify captcha
  async captchaIsValid(text, sessionCaptcha, env) {
    if (env === 'local' && text === '888') {
      return true;
    }
    return sessionCaptcha === text;
  }

  async signUp(name, email, password, refCode = '', inputCaptcha, sessionCaptcha, userIp) {
    // verify captcha
    const captchaValid = await this.captchaIsValid(inputCaptcha, sessionCaptcha, config.env);
    if (!captchaValid) {
      throw new CustomError(STATUS_TYPE.PORTAL_CAPTCHA_INVAILD);
    }

    const existingUser = await PortalUserModel.findOne({ email }).lean();
    if (existingUser) {
      throw new CustomError(STATUS_TYPE.PORTAL_EMAIL_ALREADY_REGISTERED);
    }
    const user = new PortalUserModel({ name, email, password });

    // if new user is recommanded by other user, we can get referrer's information
    if (refCode) {
      const seqId = hashidsDecode(refCode);
      const refUser = await PortalUserModel.findOne({ seq_id: seqId }).lean();
      if (refUser) {
        user.inviter = refUser._id;
      } else {
        throw new CustomError(STATUS_TYPE.PORTAL_INVALID_INVITATION_CODE);
      }
    }

    const pwd = await UserService.generatePassword(user.password);
    user.salt = pwd.salt;
    user.password = pwd.password;
    user.nick_name = name;
    user.seq_id = await SequenceService.getNextSequenceValue('portal_user');
    user.invitation_code = hashidsEncode(user.seq_id);

    // Number of free membership days for new users
    user.vip_time_out_at = dayjs().add(10, 'day').toDate();

    const doc = await user.save();

    if (!doc) {
      throw new CustomError(STATUS_TYPE.PORTAL_REGISTRATION_FAILED);
    }

    // const giveToken = await commonConfig.getGiveToken();
    // const { from, coin, sign } = giveToken;
    // await assets.sendToken({ from, email: user.email, token: coin, amount: sign, describe: 'signup', invitee: '', invitee_email: '' });

    await this.sendActivateEmail(email, userIp);

    return doc;
  }

  // user login
  async signin(loginInfo, userIp, inputCaptcha, sessionCaptcha) {
    // verify captcha
    const captchaValid = await this.captchaIsValid(inputCaptcha, sessionCaptcha, config.env);
    if (!captchaValid) {
      throw new CustomError(STATUS_TYPE.PORTAL_CAPTCHA_INVAILD);
    }
    const start = Date.now();
    const user = await PortalUserModel.findOne({ email: loginInfo.email }).lean();

    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_INCORRECT_PASSWORD);
    }

    const isPasswordCorrect = await this._verifyPassword(
      loginInfo.password,
      user.salt,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new CustomError(STATUS_TYPE.PORTAL_INCORRECT_PASSWORD);
    }

    if (!user.is_activated) {
      throw new CustomError(STATUS_TYPE.PORTAL_NOT_ACTIVATED);
    }

    await PortalTokenModel.deleteMany({ user_id: user._id, type: 'session' });

    const token = await this._getToken(user, userIp);
    const userInfo = _.pick(user, [
      '_id',
      'real_name',
      'nick_name',
      'mobile',
      'email',
      'is_activated',
      'vip_time_out_at',
      'XBT',
      'seq_id',
    ]);

    const info = {
      token,
      user: userInfo,
    };

    return info;
  }

  // user logout
  async signout(token) {
    if (token) {
      await PortalTokenModel.findOneAndDelete({ token });
    }
  }

  async refreshToken(currentToken, userId, userIp) {
    const tokenDoc = await PortalTokenModel.findOne({
      token: currentToken,
      type: 'session',
    });

    if (!tokenDoc) {
      throw new CustomError(STATUS_TYPE.PORTAL_TOKEN_ILLEGAL, 401);
    }

    if (tokenDoc.user_id.toString() !== userId) {
      throw new CustomError(STATUS_TYPE.PORTAL_TOKEN_ILLEGAL, 401);
    }

    if ((+new Date() - tokenDoc.last_access_time) / 1000 > 100000) {
      await PortalTokenModel.deleteOne({ _id: tokenDoc._id });
      throw new CustomError(STATUS_TYPE.PORTAL_TOKEN_EXPIRED, 401);
    }

    // Delete old token
    await PortalTokenModel.deleteOne({ _id: tokenDoc._id });

    // Get user info for generating new token
    const user = await PortalUserModel.findById(userId).lean();
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    const newToken = await this._getToken(user, userIp);
    return { token: newToken };
  }

  async getLoginfoByToken(token) {
    const tokenObj = await PortalTokenModel.findOne({ token });
    return tokenObj;
  }

  async deleteToken(loginInfo) {
    await PortalTokenModel.findOneAndDelete({ _id: loginInfo._id });
    return loginInfo;
  }

  async modifyAccessTime(loginInfo) {
    loginInfo.last_access_time = Date.now();
    await loginInfo.save();
    return loginInfo;
  }

  async sendRetrieveEmail(userEmail, userIp, inputCaptcha, sessionCaptcha) {
    // verify captcha
    const captchaValid = await this.captchaIsValid(inputCaptcha, sessionCaptcha, config.env);
    if (!captchaValid) {
      throw new CustomError(STATUS_TYPE.PORTAL_CAPTCHA_INVAILD);
    }
    const user = await PortalUserModel.findOne({ email: userEmail }).lean();
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    // generate token
    const code = await this._getCode(user, userIp);
    const { siteName } = config;
    const { siteUrl } = config;
    const resetPasswordUrl = `${siteUrl}/reset-password/${code}`;
    const displayName = user.nick_name;
    const resetPasswordMailPath = path.resolve(__dirname, '../views/forget_password_mail.html');

    const html = await ejs.renderFile(resetPasswordMailPath, {
      siteName,
      displayName,
      resetPasswordUrl,
      siteUrl,
    });
    const resetPasswordEmail = {
      async: false,
      to: [user.email],
      subject: `[${siteName}]retrieve password`,
      text: `Hello, ${displayName}, to reset your password, please click the link: ${resetPasswordUrl}`,
      html,
    };
    const sendEmailRes = await EmailService.sendEmail(resetPasswordEmail);

    if (sendEmailRes.emailStatus === PortalEmailInfoModel.STATUS_FAILED) {
      logger.error('Error sending retrieve password email:', sendEmailRes.desc);
    }

    return {
      message: 'Reset password email will be sent!',
    };
  }

  async resetPassword(newPassword, token) {
    // reset password
    const tokenDoc = await PortalTokenModel.findOne({
      token,
      type: 'code',
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
    const user = await PortalUserModel.findById(tokenDoc.user_id);
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    const pwd = await UserService.generatePassword(newPassword);
    user.password = pwd.password;
    user.salt = pwd.salt;
    await user.save();

    // remove token
    await PortalTokenModel.deleteOne({ _id: tokenDoc._id });

    return {
      message: 'Password reset successfully',
    };
  }

  async sendActivateEmail(userEmail, userIp) {
    const user = await PortalUserModel.findOne({ email: userEmail }).lean();
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }
    if (user.is_activated) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_ALREADY_ACTIVATED);
    }

    // check whether already sent email in 5 mins（all the 'code' type tokens are used to verify, so check the generate time of the token）
    const existToken = await PortalTokenModel.findOne({ user_id: user._id, type: 'code' });
    if (existToken) {
      if ((+new Date() - existToken.last_access_time) / 1000 < config.minEmailSendInterval) {
        throw new CustomError(STATUS_TYPE.PORTAL_EMAIL_SEND_LIMIT);
      } else {
        await PortalTokenModel.deleteOne({ _id: existToken._id }); // delete exist token and then send a new one.
      }
    }

    // generate Token
    const code = await this._getCode(user, userIp);
    const { siteName } = config;
    const { siteUrl } = config;
    const activateUrl = `${siteUrl}/active-confirm/${code}`;
    const displayName = user.nick_name;
    const welcomMailPath = path.resolve(__dirname, '../views/welcome_mail.html');

    const html = await ejs.renderFile(welcomMailPath, {
      siteName,
      displayName,
      activateUrl,
      siteUrl,
    });
    const activeEmail = {
      async: false,
      to: [user.email],
      subject: `Welcome to Register at ${siteName}`,
      text: `Hello ${displayName}, welcome to register. Please click the following link to activate your account: ${activateUrl}`,
      html,
    };

    const sendEmailRes = await EmailService.sendEmail(activeEmail);
    if (sendEmailRes.emailStatus === PortalEmailInfoModel.STATUS_FAILED) {
      logger.error('Error sending activation email:', sendEmailRes.desc);
    }

    return {
      message: 'Activation email will be sent!',
    };
  }

  async activateUser(token) {
    const existToken = await PortalTokenModel.findOne({ token, type: 'code' }).lean();
    if (!existToken) {
      throw new CustomError(STATUS_TYPE.PORTAL_ACTIVATE_CODE_ILLEGAL);
    }

    if ((+new Date() - existToken.last_access_time) / 1000 > config.tokenTimeOut) {
      await PortalTokenModel.deleteOne({ _id: existToken._id });
      throw new CustomError(STATUS_TYPE.PORTAL_ACTIVATE_CODE_EXPIRED);
    }

    const user = await PortalUserModel.findById(existToken.user_id);
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }
    if (user.is_activated) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_ALREADY_ACTIVATED);
    }

    user.is_activated = true;
    // Number of free membership days for new users
    user.vip_time_out_at = dayjs().add(10, 'day').toDate();

    // Increase the inviter's membership by one day
    if (user.inviter && /^[a-f\d]{24}$/i.test(user.inviter)) {
      const refUser = await PortalUserModel.findById(user.inviter);
      if (refUser) {
        const timeOutAt = new Date(refUser.vip_time_out_at).getTime();
        const now = new Date().getTime();
        const fromTime = now > timeOutAt ? now : timeOutAt;

        const toDate = dayjs(fromTime).add(1, 'day').toDate();
        refUser.vip_time_out_at = toDate;

        // TODO: handle this part after completing assets module
        // const giveToken = await this.ctx.service.commonConfig.getGiveToken();
        // const { from, coin, invitation } = giveToken;
        // refUser.invite_reward = +refUser.invite_reward + 1;
        // refUser.invite_total = +refUser.invite_total + invitation;

        // await this.ctx.service.assets.sendToken({
        //   from,
        //   email: refUser.email,
        //   token: coin,
        //   amount: invitation,
        //   describe: 'invitation',
        //   invitee: tokenDoc.userId,
        //   invitee_email: user.email,
        // });

        await refUser.save();
      }
    }

    await user.save();
    await PortalTokenModel.deleteOne({ _id: existToken._id });
    return {
      message: 'Account activation successful.',
    };
  }

  async _verifyPassword(password, salt, encryptedPwd) {
    const iteration = 1000;
    const cryptoPassword = crypto.pbkdf2Sync(password, salt, iteration, 32, 'sha512');
    return cryptoPassword.toString('base64') === encryptedPwd;
  }

  async _getToken(user, userIp) {
    const token = this._generateToken(user);
    await new PortalTokenModel({
      user_id: user._id,
      token,
      user_ip: userIp,
      email: user.email,
      nick_name: user.nick_name,
      type: 'session',
      last_access_time: new Date(),
    }).save();
    return token;
  }

  _generateToken(user) {
    return uuidv1().replace(/-/g, '');
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
