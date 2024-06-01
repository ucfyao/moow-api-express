const SequenceCounter = require('../models/sequenceCounterModel');

class SequenceService {
  static async getNextSequenceValue(sequenceName) {
    const sequenceDocument = await SequenceCounter.findByIdAndUpdate(
      sequenceName, // use _id to find the document
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    if (!sequenceDocument) {
      throw new Error('Unable to fetch or create the sequence document');
    }
    return sequenceDocument.sequence_value;
  }
}

module.exports = SequenceService;