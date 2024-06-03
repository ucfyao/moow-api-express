const PortalUserModel = require('../models/userModel');
const sequenceService = require('./sequenceService');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const {hashidsEncode, hashidsDecode} = require('../utils/hashidsHandler');
const crypto = require('crypto');
const moment = require('moment');

class UserService {
  async getAllUsers() {
    return PortalUserModel.find();
  }

  async getUserById(id, query = {}) {
    const user = await PortalUserModel.findOne({seq_id: id}).select('-password -salt').lean();
    // if user not exist then return.
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    // if no query parameters then return all basic ingormation of user
    if (Object.keys(query).length === 0) {
      return user;
    }

    // if have query parameters then check whether each field available and return it
    const queryData = {};
    if (query.invitation_code && user.invitation_code) {
      queryData.invitation_code = user.invitation_code;
    }

    if (query.inviter && user.inviter) {
      const userInviter = await PortalUserModel.findById(user.inviter);
      queryData.inviter = userInviter ? userInviter.email : null;
    }

    // TODO: get a list of all names of coins, then search one by one
    // Or set asset as a field and set type as dict which can include all coins with nonezero value.
    //if (query.assets && user.assets) {
    //  queryData.assets = user.assets;
    //}

    if (query.invitations && user.invitation_code) {
      console.log(user.invitation_code);
      const invitationList = await PortalUserModel.find({ inviter: user._id }).select('email created_at');
      console.log(invitationList);
      queryData.invitations = invitationList
    }

    return queryData;
  }

  async createUser(name, email, password, refCode='') {
    const existingUser = await PortalUserModel.findOne({ email }).lean();
    if (existingUser) {
      console.log(STATUS_TYPE.PORTAL_EMAIL_ALREADY_REGISTERED)
      throw new CustomError(STATUS_TYPE.PORTAL_EMAIL_ALREADY_REGISTERED);
    }
    const user = new PortalUserModel({ name, email, password});

    // if new user is recommanded by other user, we can get referrer's information
    if (refCode) {
      const seqId = await hashidsDecode(refCode);
      const refUser = await PortalUserModel.findOne({ seq_id: seqId }).lean();
      if (refUser) {
        user.inviter = refUser._id;
      } else {
        throw new CustomError(STATUS_TYPE.PORTAL_INVALID_INVITATION_CODE);
      }
    }

    const pwdObj = await this.generatePassword(user.password);
    user.salt = pwdObj.salt;
    user.password = pwdObj.password;
    user.nick_name = name;
    user.seq_id = await sequenceService.getNextSequenceValue('portal_user');
    user.invitation_code = hashidsEncode(user.seq_id);

    // TODO 自动直接激活
    user.is_activated = true;
    // 默认新注册用户免费会员的天数
    user.vip_time_out_at = moment().add(10, 'days').toDate();

    const doc = await user.save();

    if (!doc) {
      throw new CustomError(STATUS_TYPE.PORTAL_REGISTRATION_FAILED);
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

  async updateUser(id, userData) {
    const user = await PortalUserModel.findOne({seq_id: id});
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    // change password
    if (userData.password && userData.new_password) {
      const isMatch = await this.comparePassword(userData.password, user.salt, user.password);
      if (!isMatch) {
        throw new CustomError(STATUS_TYPE.PORTAL_INCORRECT_PASSWORD);
      }
      const pwdObj = await this.generatePassword(userData.new_password);
      user.password = pwdObj.password;
      user.salt = pwdObj.salt;
    }

    // update basic information
    const fieldsToUpdate = ["real_name", "nick_name", "mobile", "instagram", "role", "is_deleted", "invite_reward", "invite_total"];
    fieldsToUpdate.forEach(field => {
      if (userData[field] !== undefined){
        user[field] = userData[field];
      }
    });
    const userDoc = await user.save();

    if (!userDoc) {
      throw new CustomError(STATUS_TYPE.PORTAL_UPDATE_FAILED);
    }

    // avoid return password and salt
    const doc = user.toObject();
    delete doc.password;
    delete doc.salt;
    return doc;
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