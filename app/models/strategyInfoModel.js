/*
  单条策略详情
*/

const mongoose = require('mongoose');

const StrategyInfoSchema = new mongoose.Schema({
    // id: { type: String, unique: true, trim: true }, // 自增id

    strategy_id: { type: String, trim: true }, // 定投策略id
    order_id: { type: String, trim: true }, // 平台订单标识
    type: { type: String, trim: true }, // 委托类别
    price: { type: String, trim: true }, // 下单价格
    side: { type: String, trim: true }, // 交易类型 卖:sell,买:buy
    amount: { type: String, trim: true }, // 委托数量
    funds: { type: String, trim: true }, // 委托金额
    avg_price: { type: String, trim: true }, // 平均成交价
    deal_amount: { type: String, trim: true }, // 真实成交数量
    cost: { type: String, trim: true }, // 总成交金额
    status: { type: String, trim: true }, // 订单状态
    symbol: { type: String, trim: true }, // 交易对
    orders_id: { type: String, trim: true }, // 订单子单id
    mid: { type: String, trim: true }, // 市场id
    record_amount: { type: String, trim: true }, // 已记录币数
    record_cost: { type: String, trim: true }, // 已记录金额
    pl_create_at: { type: String, trim: true }, // 委托时间
    buy_times: { type: Number, default: 0 }, // 第几次购买
    now_buy_times: { type: Number, default: 0 }, // 本轮第几次购买
    sell_times:{ type: Number, default: 0 }, // 第几次卖出
    base_total: { type: Number, default: 0 }, // 累计购买后法币总数
    quote_total: { type: Number, default: 0 }, // 累计购买后购币总数
    value_total: { type: Number, default: 0 }, // 本次购买后总价值
    now_base_total: { type: Number, default: 0 }, // 当前法币总是
    now_quote_total: { type: Number, default: 0 }, // 当前购币总数
    profit: { type: Number, default: 0 }, // 购买完成后当前利润
    profit_percentage: { type: Number, default: 0 }, // 购买完成后当前利润率

  }, {
      timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
      collection: 'strategy_info',
  });
    
module.exports = mongoose.model('StrategyInfo', StrategyInfoSchema);

