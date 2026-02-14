const mongoose = require('mongoose');

const AssetsUserOrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    amount: { type: String, trim: true },
    token: { type: String, trim: true },
    from_balance: { type: String, trim: true },
    to_balance: { type: String, trim: true },
    status: { type: String, enum: ['success', 'error'], trim: true },
    describe: { type: String, trim: true },
    invitee: { type: String, trim: true },
    invitee_email: { type: String, trim: true },
    status_describe: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'assets_user_orders',
  },
);

module.exports = mongoose.model('AssetsUserOrder', AssetsUserOrderSchema);
