const mongoose = require('mongoose');

const ClExchangeRatesSchema = new mongoose.Schema(
  {
    currency: { type: String, trim: true },
    frate: { type: Number },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'cl_exchange_rates',
  },
);

module.exports = mongoose.model('ClExchangeRates', ClExchangeRatesSchema);
