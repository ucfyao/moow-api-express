const User = require('../models/userModel');
const crypto = require('crypto');
const moment = require('moment');
const {hashidsEncode, hashidsDecode} = require('../utils/hashidsHandler');
const {generatePassword, comparePassword} = require('../utils/passwordHandler');
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
      const refUser = await User.findOne({ seq_id: seqId }).lean();
      if (refUser) {
        user.inviter = refUser._id;
      } else{
        throw new Error('Your reference code is invalid.');
      }
    }

    const pwdObj = await generatePassword(user.password);
    user.salt = pwdObj.salt;
    user.password = pwdObj.password;
    user.nick_name = name;
    user.seq_id = await sequenceService.getNextSequenceValue('portal_user');
    user.invitation_code = hashidsEncode(user.seq_id);

    // TODO  temporaryily auto active new user
    user.is_activated = true;
    // give new user 10 days vip
    user.vip_time_out_at = moment().add(10, 'days').toDate();

    const doc = await user.save();

    if (!doc) {
      throw new Error('Failed to register, please try again.');
    }

    //const giveToken = await commonConfig.getGiveToken();
    //const { from, coin, sign } = giveToken;
    //await assets.sendToken({ from, email: user.email, token: coin, amount: sign, describe: 'signup', invitee: '', invitee_email: '' });

    // TODO ignore the email service temporarily
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