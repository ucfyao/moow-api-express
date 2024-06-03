const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  name: { type: String, trim: true }, // config name
  content: { type: Object, trim: true }, // config content
  sequence_value: { type: Number, default: 0 }, // unique id
  updated_at: { type: Date }, // latest update time stamp
  created_at: { type: Date }, // creation time stamp
}, {
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'  
  }, // auto create created_at and updated_at
  collection: 'common_configs' 
});

const CommonConfig = mongoose.model('CommonConfig', ConfigSchema);
module.exports = CommonConfig;