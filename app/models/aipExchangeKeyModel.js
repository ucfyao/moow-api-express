const mongoose = require('mongoose');

const AipExchangeKeySchema = new mongoose.Schema(
  {
    uid: { type: mongoose.Schema.Types.ObjectId }, // User Id, ref: 'PortalUser'
    exchange: { type: String, required: true }, // Exchange code
    access_key: { type: String, required: true }, // key
    secret_show: { type: String, trim: true, default: '' }, // Desensitization secret
    secret_key: { type: String, required: true }, // secret
    desc: { type: String, required: true, trim: true, default: '' }, // Required field, automatically trimmed, default value is empty string
    is_deleted: { type: Boolean, default: false }, // delete mark
    status: {
      type: Number,
      default() {
        return this.constructor.KEY_STATUS_NORMAL;
      },
    }, // AipKey status. 1: Normal. 2: Closed 3: Soft deleted
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'aip_exchange_keys',
  },
);

// Key Status
AipExchangeKeySchema.statics.KEY_STATUS_NORMAL = 1;
AipExchangeKeySchema.statics.KEY_STATUS_CLOSED = 2;
AipExchangeKeySchema.statics.KEY_STATUS_SOFT_DELETED = 3;

const AipExchangeKeyModel = mongoose.model('aip_exchange_key', AipExchangeKeySchema);
module.exports = AipExchangeKeyModel;
