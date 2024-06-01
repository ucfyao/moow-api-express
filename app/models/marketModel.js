const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  name: { type: String }, // The name of the exchange platform
  exchange: { type: String, unique: true, trim: true }, // The exchange's ccxt name
  desc: { type: String, trim: true, default: '' }, // The description of exchange
  url: { type: String, trim: true, default: '' }, // The official website of the exchange platform
  is_deleted: { type: Boolean, default: false }, // The flag of delete
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, // Auto-add created_at and updated_at fields
  collection: 'portal_markets', // Collection name
});

const Market = mongoose.model('Market', MarketSchema);
module.exports = Market;