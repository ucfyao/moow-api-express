const User = require('../models/userModel');
const crypto = require('crypto');
const moment = require('moment');
const {hashidsEncode, hashidsDecode} = require('../utils/hashidsHandler');
const {generatePassword, comparePassword} = require('../utils/passwordHandler');
const sequenceService = require('./sequenceService');
const commonConfig = require('./commonConfig')
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
        user.ref = refUser._id;
      }
    }

    const pwdObj = await generatePassword(user.password);
    user.salt = pwdObj.salt;
    user.password = pwdObj.password;
    user.nickName = name;
    user.seqId = await sequenceService.getNextSequenceValue('portal_user');

    // TODO 自动直接激活
    user.isActivated = true;
    // 默认新注册用户免费会员的天数
    user.vipTimeoutAt = moment().add(10, 'days').toDate();

    const doc = await user.save();

    if (!doc) {
      throw new Error('Failed to register, please try again.');
    }

    const giveToken = await commonConfig.getGiveToken();
    const { from, coin, sign } = giveToken;
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
}

module.exports = new UserService();