const User = require('../models/userModel');
const crypto = require('crypto');
const moment = require('moment');
const {hashidsEncode, hashidsDecode} = require('../utils/hashidsHandler');
const sequenceService = require('./sequenceService');
const commonConfig = require('./commonConfigService')

//const assets = require('./assets');
class UserService {
  async getAllUsers() {
    return User.find();
  }

  async getUserById(id) {
    return User.findById(id);
  }

  async createUser(name, email, password, refCode='') {
    const existingUser = await User.findOne({ email }).lean();
        if (existingUser) {
            throw new Error('The email is already registered.');
        }

    const user = new User({ name, email, password});
    
    // if new user is recommanded by other user, we can get referrer's information
    if (refCode) {
      const seqId = await hashidsDecode(refCode);
      const refUser = await User.findOne({ seqId }).lean();
      if (refUser) {
        user.inviter = refUser._id;
      }
    }

    const pwdObj = await this.generatePassword(user.password);
    user.salt = pwdObj.salt;
    user.password = pwdObj.password;
    user.nick_name = name;
    user.seq_id = await sequenceService.getNextSequenceValue('portal_user');
    user.referral_code = hashidsEncode(user.seq_id);

    // TODO 自动直接激活
    user.is_activated = true;
    // 默认新注册用户免费会员的天数
    user.vip_time_out_at = moment().add(10, 'days').toDate();

    const doc = await user.save();

    if (!doc) {
      throw new Error('Failed to register, please try again.');
    }

    //const giveToken = await commonConfig.getGiveToken();
    //const { from, coin, sign } = giveToken;
    //await assets.sendToken({ from, email: user.email, token: coin, amount: sign, describe: 'signup', invitee: '', invitee_email: '' });

    // TODO 先取消邮件激活功能
    // const userId = doc._id;
    // const start = Date.now();
    // await this.sendActivateEmail({ userId });
    // ctx.logger.info('新用户注册：\n  用户Id: \t%j\n  用户信息: \t%j\n  请求时长: \t%j ms\n',
    //   userId, user, Date.now() - start)\

    return doc;
  }

  async updateUser(id, name, email) {
    return User.findByIdAndUpdate(id, { name, email }, { new: true });
  }

  async deleteUser(id) {
    return User.findByIdAndDelete(id);
  }

  async generatePassword(password) {
    const salt = crypto.randomBytes(32).toString('base64');
    const cryptoPassword = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512');

    return {
        salt: salt,
        password: cryptoPassword.toString('base64')
    };
}

  async comparePassword(password, salt, hash) {
    const cryptoPassword = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512');
    return cryptoPassword.toString('base64') === hash;
}

}

module.exports = new UserService();