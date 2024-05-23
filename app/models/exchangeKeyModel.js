const mongoose = require('mongoose');

const ExchangeKeySchema = new mongoose.Schema({
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' }, // unique id
    exchange: { type: String }, // The name of the exchange
    accessKey: { type: String, trim: true, default: '' },  // access key
    secretKey: { type: String, trim: true, default: '' },  // secret
    secretShow: { type: String, trim: true, default: '' },  // original secret
    remarks: { type: String, trim: true },  // remarks
    isDeleted: { type: Boolean, default: false }, // the flag of deleted or not
  }, {
    timestamps: true,
    collection: 'exchangekeys', // Use the plural form of the model name as the collection name
  });

  module.exports = mongoose.model('ExchangeKey', ExchangeKeySchema);