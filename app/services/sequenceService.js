const CommonSequenceCounterModel = require('../models/commonSequenceCounterModel');

class SequenceService {
  static async getNextSequenceValue(sequenceName) {
    const sequenceDocument = await CommonSequenceCounterModel.findOneAndUpdate(
      {
        sequence_name: sequenceName,
      },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true },
    );
    if (!sequenceDocument) {
      throw new Error('Unable to fetch or create the sequence document');
    }
    return sequenceDocument.sequence_value;
  }
}

module.exports = SequenceService;
