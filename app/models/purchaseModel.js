const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' },
    eth_address: { type: String, trim: true },
    tx_hash: { type: String, trim: true },
    amount: { type: String, trim: true },
    status: {
      type: String,
      enum: ['waiting', 'fail', 'success', 'invalid'],
      default: 'waiting',
    },
    comment: { type: String, trim: true },
    email: { type: String, trim: true },
    ref: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'purchases',
  },
);

PurchaseSchema.statics.STATUS_WAITING = 'waiting';
PurchaseSchema.statics.STATUS_FAIL = 'fail';
PurchaseSchema.statics.STATUS_SUCCESS = 'success';
PurchaseSchema.statics.STATUS_INVALID = 'invalid';

module.exports = mongoose.model('Purchase', PurchaseSchema);
