const mongoose = require('mongoose');

const CommonSequenceCounterSchema = new mongoose.Schema(
  {
    sequence_name: { type: String, required: true, unique: true }, // auto-increase Id
    sequence_value: { type: Number, default: 0 }, // auto-increase sequence value
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'common_sequence_counters',
  },
);

const CommonSequenceCounterModel = mongoose.model('CommonSequenceCounterModel', CommonSequenceCounterSchema);
module.exports = CommonSequenceCounterModel;
