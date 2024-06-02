const mongoose = require('mongoose');

const SequenceCounterSchema = new mongoose.Schema({
  // _id: { type: String, required: true, unique: true }, // auto-increase Id
  sequence_value: { type: Number, default: 0 } // auto-increase sequence value
}, {
  collection: 'common_sequence_counters' 
});

const SequenceCounter = mongoose.model('SequenceCounter', SequenceCounterSchema);
module.exports = SequenceCounter;