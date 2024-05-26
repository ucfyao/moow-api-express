const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  //_id: { type: Schema.Types.ObjectId, auto: true }, // 自动生成，无需在此定义
  seqId: { type: Number, unique: true }, // 唯一序列号
  nickName: {type: String, required: true, trim: true},
  email: { type: String, required: true, unique: true, trim: true }, // 邮箱，唯一，去空格
  ref: { type: String, trim: true }, // 推荐人id
  realName: { type: String, trim: true }, // 真实姓名
  password: { type: String, required: true, trim: true }, // 密码
  salt: { type: String, required: true, unique: true, trim: true }, // 盐
  mobile: { type: String, default: '', trim: true }, // 手机号
  wechat: { type: String, default: '', trim: true }, // 微信号
  qq: { type: String, default: '', trim: true }, // QQ号
  //role: { type: Schema.Types.ObjectId, ref: 'PortalRole', default: [] }, // 角色引用
  lastLoginTime: { type: Date }, // 最近一次登录时间
  vipTimeoutAt: { type: Date }, // VIP到期时间
  lastLoginIP: { type: String, trim: true }, // 最近登录IP
  isActivated: { type: Boolean, default: false }, // 是否激活
  isDeleted: { type: Boolean, default: false }, // 是否删除
  XBT: { type: String, default: '0' }, // 代币余额
  invite_reward: { type: String, default: '0' }, // 邀请奖励
  invite_total: { type: String, default: '0' } // 总邀请奖励
}, {
  timestamps: true  // 自动生成createdAt和updatedAt
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
