const _ = require("lodash");
const crypto = require("crypto");
const { v1: uuidv1 } = require("uuid");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");

class AuthService {
  async captchaIsValid(text, sessionCaptcha, env) {
    if (env === "local" && text === "888") {
      return true;
    }
    return sessionCaptcha === text;
  }

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

    await Token.deleteMany({ user_id: oUser._id, type: "session" });

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
    await new Token({
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
}

module.exports = new AuthService();
