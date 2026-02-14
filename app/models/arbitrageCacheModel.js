const mongoose = require('mongoose');

const ArbitrageCacheSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    content: [{ type: String }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'arbitrage_caches',
  },
);

module.exports = mongoose.model('ArbitrageCache', ArbitrageCacheSchema);
