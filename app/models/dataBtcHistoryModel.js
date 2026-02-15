const mongoose = require('mongoose');

const { Schema } = mongoose;

const DataBtcHistorySchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // Date string YYYY-MM-DD
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    volume: { type: Number },
    exchange: { type: String, default: 'binance' },
    symbol: { type: String, default: 'BTC/USDT' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'data_btc_history',
  }
);

DataBtcHistorySchema.index({ date: -1 });

module.exports = mongoose.model('DataBtcHistory', DataBtcHistorySchema);
