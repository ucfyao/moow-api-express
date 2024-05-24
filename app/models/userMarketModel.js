const mongoose = require('mongoose');

const UserMarketSchema = new mongoose.Schema({
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' }, // User ID
    exchange: { type: String }, // The exchange's ccxt name
    access_key: { type: String, trim: true, default: '' },  // access key
    secret_key: { type: String, trim: true, default: '' },  // secret key
    secret_show: { type: String, trim: true, default: '' },  // original secret
    desc: { type: String, trim: true },  // remarks
    is_deleted: { type: Boolean, default: false }, // the flag of deleted or not
  }, {
    timestamps: true, // Auto-add created_at and updated_at fields
    collection: 'user_markets', // Use the plural form of the model name as the collection name
  });

  module.exports = mongoose.model('UserMarket', UserMarketSchema);