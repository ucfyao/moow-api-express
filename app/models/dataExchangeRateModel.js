const mongoose = require('mongoose');

const dataExchangeRateSchema = new mongoose.Schema(
{
  from_currency: {type: String, required: true, trim: true},
  to_currency: {type: String, required: true, trim: true},
  rate: {type: Number, required: true},
  last_update: {type: Date, default: Date.now, expires: '24h'},
}, // auto delete in 24h
{
  timestamps: {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  }, 
  collection: 'data_exchange_rates',
},
);

const DataExchangeRateModel = mongoose.model('data_exchange_rate', dataExchangeRateSchema);

module.exports = DataExchangeRateModel;
