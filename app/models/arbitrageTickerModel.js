const mongoose = require('mongoose');

const ArbitrageTickerSchema = new mongoose.Schema(
  {
    exchange: { type: String, required: true, trim: true }, // CCXT exchange id (e.g. "binance")
    symbol: { type: String, required: true, trim: true }, // Trading pair (e.g. "BTC/USDT")
    ticker: {
      exchange: { type: String, trim: true },
      symbol: { type: String, trim: true },
      timestamp: { type: Number },
      datetime: { type: String, trim: true },
      high: { type: Number },
      low: { type: Number },
      bid: { type: Number }, // current best bid (buy) price
      bidVolume: { type: Number },
      ask: { type: Number }, // current best ask (sell) price
      askVolume: { type: Number },
      vwap: { type: Number },
      open: { type: Number },
      close: { type: Number },
      last: { type: Number },
      previousClose: { type: Number },
      change: { type: Number },
      percentage: { type: String },
      average: { type: Number },
      baseVolume: { type: Number },
      quoteVolume: { type: Number },
      info: { type: mongoose.Schema.Types.Mixed },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_tickers',
  },
);

ArbitrageTickerSchema.index({ exchange: 1, symbol: 1 }, { unique: true });
ArbitrageTickerSchema.index({ updated_at: -1 });

module.exports = mongoose.model('ArbitrageTicker', ArbitrageTickerSchema);
