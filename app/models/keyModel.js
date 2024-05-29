// models/keyModel.js
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

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
  collection: 'aip_key',
});

KeySchema.pre('save', function (next) {
  if (this.isNew) {
    // Encrypt access_key and secret_key
    this.access_key = JSON.stringify(encrypt(this.access_key));
    this.secret_key = JSON.stringify(encrypt(this.secret_key));

    //Generate desensitized secret_show
    const decryptedsecret_key = decrypt(JSON.parse(this.secret_key));
    this.secret_show = `${decryptedsecret_key.slice(0, 3)}******${decryptedsecret_key.slice(-3)}`;
  }
  next();
});

//KeySchema.index({ _id: 1 }, { unique: true });

const Key = mongoose.model('Key', KeySchema);
module.exports = Key;
