const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  name: { type: String, trim: true }, // config name
  content: { type: Object, trim: true }, // config content
  sequence_value: { type: Number, default: 0 }, // unique id
  updated_at: { type: Date }, // latest update time stamp
  created_at: { type: Date }, // creation time stamp
}, {
  timestamps: true, 
  collection: 'common_config' 
});

module.exports = mongoose.model('CommonConfig', ConfigSchema);