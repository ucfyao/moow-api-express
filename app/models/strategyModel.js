const mongoose = require('mongoose');
// After selecting the period, perform normal distribution to different days and 
// times to prevent concurrency issues.

const StartegySchema = new mongoose.Schema({
    // id: { type: String, unique: true, trim: true }, // Auto-increment id
    // created_by: { type: String, unique: true, trim: true }, // Creator

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' }, // Creator
    period: { type: String, trim: true }, // Period type. 1: Month, 2: Day, 3: Week
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
    drawdown_status: { type: String, default: 'N' }, //  Whether to enable maximum drawdown. Y: Enabled, N: Disabled
    drawdown: { type: Number }, // Maximum drawdown (%)
    drawdown_price: { type: Number }, // Lock-in price after take-profit is triggered
    sell_price: { type: Number, default: 0 }, // Sale price
    profit_percentage: { type: Number, default: 0 }, // Profit percentage
    profit: { type: Number, default: 0 }, // Profit
    type: { type: String, trim: true }, // Investment type. 1: Regular investment. 2: Intelligent investment
    status: { type: String, default: '1' }, // Strategy status. 1: Normal. 2: Closed 3: Soft deleted
    stop_reason: { type: String, trim: true }, // Stop reason
    start_at: { type: Date }, // Start time
    end_at: { type: Date }, // End time

    }, {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        collection: 'aip_strategies',
    });

const Startegy = mongoose.model('Startegy', StartegySchema);
module.exports = Startegy;

