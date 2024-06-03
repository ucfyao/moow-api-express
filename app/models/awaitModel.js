const mongoose = require('mongoose');
// After selecting the period, perform normal distribution to different days and times to prevent concurrency issues.

const AwaitSchema = new mongoose.Schema({
    id: { type: String, unique: true, trim: true }, // Auto-increment id

    strategy_id: { type: String, trim: true }, // Investment strategy id
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' },
    await_status: { type: String, trim: true }, // 1: Waiting 2: Completed 3: Processing
    sell_type: { type: String, trim: true }, // 1: Automatic sell 2: Delete investment
    sell_price: { type: Number, default: 0 }, // Sell price

    user_market_id: { type: String, trim: true }, // ID of the market key set by the user
    exchange: { type: String, trim: true }, // Market
    key: { type: String, trim: true }, // Market key set by the user
    secret: { type: String, trim: true }, // Market secret set by the user
    symbol: { type: String, trim: true }, // Trading pair
    base: { type: String, trim: true }, // Base currency, fiat. Example: RMB, USDT
    quote: { type: String, trim: true }, // Token. Example: EOS, LMC

    base_limit: { type: Number }, // Amount for each purchase
    base_total: { type: Number, default: 0 }, // Total purchase amount
    quote_total: { type: Number, default: 0 }, // Total acquired tokens

    }, {
        timestamps: true,
        collection: 'aip_awaits',
    });
  // QuantsDingtouAwaitSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
  //   return this.collection.findAndModify(query, sort, doc, options, callback);
  // };

const Await = mongoose.model('Await', AwaitSchema);
module.exports = Await;
