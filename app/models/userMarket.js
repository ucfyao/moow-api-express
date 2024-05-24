// models/userMarket.js
const mongoose = require('mongoose');

const UsermarketSchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId }, // 用户Id, ref: 'PortalUser'
  exchange: { type: String, required: true }, // 交易所编码
  accessKey: { type: String, required: true },  // key
  secret_show: { type: String, trim: true, default: '' },  // 脱敏的secret
  secretKey: { type: String, required: true },  // secret
  desc: { type: String, required: true, trim: true, default: '' }, // 必须字段，自动修剪，默认值为空字符串
  isDeleted: { type: Boolean, default: false }, // 删除标记
}, {
  timestamps: true,
  collection: 'user_market',
});

UsermarketSchema.pre('save', function (next) {
  if (this.isNew) {
    const idStr = this._id.toString();
    this.secret_show = `${idStr.slice(0, 3)}******${idStr.slice(-3)}`;
  }
  next();
});

const userMarket = mongoose.model('userMarket', UsermarketSchema);

module.exports = userMarket;
