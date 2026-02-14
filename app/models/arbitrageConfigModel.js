const mongoose = require('mongoose');

const ArbitrageConfigSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser', default: null },
    exchanges: [{ type: String, trim: true }],
    symbols: [{ type: String, trim: true }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_configs',
  },
);

ArbitrageConfigSchema.index({ user_id: 1 });

module.exports = mongoose.model('ArbitrageConfig', ArbitrageConfigSchema);
