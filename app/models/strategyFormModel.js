/*
  策略表单
*/

const mongoose = require('mongoose');
// 选定周期后，进行正态分布至不同日时分,防止并发问题。

const StartegyFormSchema = new mongoose.Schema({
    // id: { type: String, unique: true, trim: true }, // 自增id
    // created_by: { type: String, unique: true, trim: true }, // 创建者

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' }, // 创建者
    period: { type: String, trim: true }, // 周期类型。1：月，2：日，3：周
    period_value: { type: [Number] }, // 定投周期
    hour: { type: String, trim: true }, // 购买时, 创建时随机写入0-23，用来定投执行时筛选
    minute: { type: String, trim: true }, // 购买分, 创建时随机写入0-59，用来定投执行时筛选

    user_market_id: { type: String, trim: true }, // 用户设置的市场key的id
    exchange: { type: String, trim: true }, // 市场
    key: { type: String, trim: true }, // 用户设置的市场key
    secret: { type: String, trim: true }, // 用户设置的市场secret
    symbol: { type: String, trim: true }, // 交易对
    base: { type: String, trim: true }, // 基本币、法币。例：rmb，usdt
    quote: { type: String, trim: true }, // 代币。例：eos，lmc

    base_limit: { type: Number }, // 每次购买金额
    base_total: { type: Number, default: 0 }, // 总计购买金额
    base_fee: { type: Number, default: 0 }, // 法币手续费
    quote_fee: { type: Number, default: 0 }, // 代币手续费
    quote_total: { type: Number, default: 0 }, // 总计获取代币
    buy_times: { type: Number, default: 0 }, // 购买次数
    sell_times: { type: Number, default: 0 }, // 卖出次数
    now_buy_times: { type: Number, default: 0 }, // 本轮第几次购买
    now_base_total: { type: Number, default: 0 }, // 当前法币总数
    now_quote_total: { type: Number, default: 0 }, // 当前购币总数
    stop_profit_percentage: { type: Number }, // 止盈率(%)
    drawdown_status: { type: String, default: 'N' }, // 是否启用最大回撤。Y:启用，N:不启用
    drawdown: { type: Number }, // 最大回撤(%)
    drawdown_price: { type: Number }, // 触发止盈后的锁定价格,
    sell_price: { type: Number, default: 0 }, // 卖出价格
    profit_percentage: { type: Number, default: 0 }, // 利润率
    profit: { type: Number, default: 0 }, // 利润
    type: { type: String, trim: true }, // 定投类型。1，普通定投。2，智能定投
    status: { type: String, default: '1' }, // 策略状态。1: 正常。2: 关闭 3: 软删除
    stop_reason: { type: String, trim: true }, // 停止原因
    start_at: { type: Date }, // 开始时间
    end_at: { type: Date }, // 结束时间

    }, {
        timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
        collection: 'strategy_form',
    });
    
module.exports = mongoose.model('StartegyForm', StartegyFormSchema);

