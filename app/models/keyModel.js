// models/keyModel.js
const mongoose = require('mongoose');

const KeySchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId }, // User Id, ref: 'PortalUser'
  exchange: { type: String, required: true }, // Exchange code
  access_key: { type: String, required: true },  // key
  secret_show: { type: String, trim: true, default: '' },  // Desensitization secret
  secret_key: { type: String, required: true },  // secret
  desc: { type: String, required: true, trim: true, default: '' }, // Required field, automatically trimmed, default value is empty string
  is_deleted: { type: Boolean, default: false }, // delete mark
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'key',
});

const Key = mongoose.model('Key', KeySchema);

module.exports = Key;