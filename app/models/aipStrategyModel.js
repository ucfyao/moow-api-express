const mongoose = require('mongoose');
// After selecting the period, perform normal distribution to different days and
// times to prevent concurrency issues.

const AipStartegySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' }, // Creator
    period: { type: String, trim: true }, // Period type. 1: Daily, 2: Weekly, 3: Monthly
    period_value: { type: [Number] }, // Investment period
    hour: { type: String, trim: true }, //  Purchase hour, randomly assigned 0-23 at creation for filtering during execution
    minute: { type: String, trim: true }, // Purchase minute, randomly assigned 0-59 at creation for filtering during execution

    user_market_id: { type: String, trim: true }, // ID of the market key set by the user
    exchange: { type: String, trim: true }, // Market
    key: { type: String, trim: true }, // Market key set by the user
    secret: { type: String, trim: true }, // Market secret set by the user
    symbol: { type: String, trim: true }, // Trading pair
    base: { type: String, trim: true }, // Base currency, fiat. Example: RMB, USDT
    quote: { type: String, trim: true }, // Token. Example: EOS, LMC

    base_limit: { type: Number }, // Amount for each purchase
    base_total: { type: Number, default: 0 }, // Total purchase amount
    base_fee: { type: Number, default: 0 }, // Fiat currency fee
    quote_fee: { type: Number, default: 0 }, // Token fee
    quote_total: { type: Number, default: 0 }, // Total acquired tokens
    buy_times: { type: Number, default: 0 }, // Number of purchases
    sell_times: { type: Number, default: 0 }, // Number of sales
    now_buy_times: { type: Number, default: 0 }, // Number of purchases in this round
    now_base_total: { type: Number, default: 0 }, // Current total fiat amount
    now_quote_total: { type: Number, default: 0 }, // Current total token amount
    stop_profit_percentage: { type: Number }, // Take-profit percentage (%)
    drawdown_status: {
      type: String,
      default() {
        return this.constructor.DRAWDOWN_STATUS_DISABLED;
      },
    }, //  Whether to enable maximum drawdown. Y: Enabled, N: Disabled
    drawdown: { type: Number }, // Maximum drawdown (%)
    drawdown_price: { type: Number }, // Lock-in price after take-profit is triggered
    sell_price: { type: Number, default: 0 }, // Sale price
    profit_percentage: { type: Number, default: 0 }, // Profit percentage
    profit: { type: Number, default: 0 }, // Profit
    type: { type: Number, trim: true }, // Investment type. 1: Regular investment. 2: Intelligent investment
    status: {
      type: Number,
      default() {
        return this.constructor.STRATEGY_STATUS_NORMAL;
      },
    }, // Strategy status. 1: Normal. 2: Closed 3: Soft deleted
    stop_reason: { type: String, trim: true }, // Stop reason
    start_at: { type: Date }, // Start time
    end_at: { type: Date }, // End time
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }, // Automatically adds createdAt and updatedAt fields
    collection: 'aip_strategies',
  }
);

// Period status
AipStartegySchema.statics.PERIOD_DAILY = 1;
AipStartegySchema.statics.PERIOD_WEEKLY = 2;
AipStartegySchema.statics.PERIOD_MONTHLY = 3;

// Investment type
AipStartegySchema.statics.INVESTMENT_TYPE_REGULAR = 1;
AipStartegySchema.statics.INVESTMENT_TYPE_INTELLIGENT = 2;

// Strategy status
AipStartegySchema.statics.STRATEGY_STATUS_NORMAL = 1;
AipStartegySchema.statics.STRATEGY_STATUS_CLOSED = 2;
AipStartegySchema.statics.STRATEGY_STATUS_SOFT_DELETED = 3;

// Drawdown status
AipStartegySchema.statics.DRAWDOWN_STATUS_ENABLED = 'Y';
AipStartegySchema.statics.DRAWDOWN_STATUS_DISABLED = 'N';

AipStartegySchema.index({ status: 1, minute: 1 });
AipStartegySchema.index({ user: 1, status: 1 });

const AipStartegyModel = mongoose.model('aip_strategy', AipStartegySchema);
module.exports = AipStartegyModel;
