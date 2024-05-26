/*
  策略操作
*/

const mongoose = require('mongoose');
// 选定周期后，进行正态分布至不同日时分,防止并发问题。
const StrategyAwaitSchema = new mongoose.Schema({
    id: { type: String, unique: true, trim: true }, // 自增id

    dingtou_id: { type: String, trim: true }, // 定投策略id
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' },
    await_status: { type: String, trim: true }, //  1: 等待 2: 完成 3: 处理中
    sell_type: { type: String, trim: true }, // 1: 自动卖出 2: 删除定投
    sell_price: { type: Number, default: 0 }, // 卖出价格

    user_market_id: { type: String, trim: true }, // 用户设置的市场key的id
    exchange: { type: String, trim: true }, // 市场
    key: { type: String, trim: true }, // 用户设置的市场key
    secret: { type: String, trim: true }, // 用户设置的市场secret
    symbol: { type: String, trim: true }, // 交易对
    base: { type: String, trim: true }, // 基本币、法币。例：rmb，usdt
    quote: { type: String, trim: true }, // 代币。例：eos，lmc

    base_limit: { type: Number }, // 每次购买金额
    base_total: { type: Number, default: 0 }, // 总计购买金额
    quote_total: { type: Number, default: 0 }, // 总计获取代币

    }, {
        timestamps: true,
        collection: 'strategy_await',
    });
  // QuantsDingtouAwaitSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  //   return this.collection.findAndModify(query, sort, doc, options, callback);
  // };
module.exports = mongoose.model('StrategyAwait', StrategyAwaitSchema);
