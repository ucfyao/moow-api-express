// models/marketModel.js
const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 交易所名字
  exchange: { type: String, required: true }, // 交易所编码
  desc: { type: String, required: true, trim: true, default: '' }, // 必须字段，自动修剪，默认值为空字符串
  url: { type: String, required: true, trim: true, default: '' },  // 自动修剪，默认值为空字符串
  isDeleted: { type: Boolean, default: false }, // 删除标记
}, {
  timestamps: true,
  collection: 'markets',
});

MarketSchema.pre('save', function (next) {
  if (this.isNew) {
    const idStr = this._id.toString();
    this.secret_show = `${idStr.slice(0, 3)}******${idStr.slice(-3)}`;
  }
  next();
});

const Market = mongoose.model('Market', MarketSchema);

module.exports = Market;
