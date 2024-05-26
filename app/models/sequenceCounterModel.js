const mongoose = require('mongoose');

const SequenceCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true }, // auto-increase Id
  sequence_value: { type: Number, default: 0 } // auto-increase sequence value
}, {
  collection: 'sequence_counter' 
});

module.exports = mongoose.model('sequence_counter', SequenceCounterSchema);