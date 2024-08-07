const mongoose = require('mongoose');

const DataExchangeSymbolSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true }, 
    exchange: { type: String, trim: true },  // Name of the platform
    symbol: { type: String, trim: true },  // Trading pair
    open: { type: String, trim: true }, // the price when k lines starts
    high: { type: String, trim: true }, // highest price during our interval
    low: { type: String, trim: true },  // lowest price during our interval
    close: { type: String, trim: true },  // Close price (USD)
    volume: { type: String, trim: true },  // Volume (USD)
    price_usd: { type: String, trim: true },  // Close price (USD)
    price_cny: { type: String, trim: true },  // Close price (CNY)
    price_btc: { type: String, trim: true },  // Price (BTC)
    price_native: { type: String, trim: true },  // Price
    vol_cny: { type: String, trim: true },  // Transaction amount (CNY)
    vol_usd: { type: String, trim: true },  // Transaction amount (USD)
    vol_btc: { type: String, trim: true },  // Transaction amount (BTC)
    vol_native: { type: String, trim: true },  // Transaction amount
    trade_vol: { type: String, trim: true },  // Volume (USD: Transaction amount / Price)
    percent: { type: String, trim: true }, 
    base: { type: String, trim: true },  //  Base currency. Example: CNY
    quote: { type: String, trim: true },  // Quote currency. Example: LMC
    exchange_url: { type: String, trim: true },  // Exchange url
    on_time: { type: Date, unique: true },  // Listing Time
    status: { type: String,trim: true, default: '' },  // Status. 1: Normal, 2: Closed
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }, 
    collection: 'data_exchange_symbols',
  },
);

const DataExchangeSymbolModel = mongoose.model('data_exchange_symbol', DataExchangeSymbolSchema);
module.exports = DataExchangeSymbolModel;
