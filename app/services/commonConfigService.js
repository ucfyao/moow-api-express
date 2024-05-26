const CommonConfigModel = require('../models/commonConfigModel');

class CommonConfigService {
  constructor() {
    this.config = {};
  }

  async getNextSequenceValue() {
    const sequenceDocument = await CommonConfigModel.findOneAndUpdate(
      { name: 'auto_user_id' },
      { $inc: { sequence_value: 1 } },
      {
        new: true,
        select: 'sequence_value',
      });
    return sequenceDocument.sequence_value;
  }

  async getGiveToken() {
    const giveToken = await CommonConfigModel.findOne({ name: 'give_token' });
    return giveToken ? giveToken.content : undefined;
  }

  async getDingTouId() {
    const dingTouId = await CommonConfigModel.findOne({ name: 'dingtou_id' });
    return dingTouId ? dingTouId.content : 0;
  }

  async getAccessToken() {
    const accessToken = await CommonConfigModel.findOne({ name: 'access_token' });
    return accessToken ? accessToken.content : null;
  }

  async setAccessToken(access_token) {
    const accessToken = await CommonConfigModel.findOneAndUpdate(
      { name: 'access_token' },
      { content: access_token },
      { new: true }
    );
    return accessToken;
  }
}

module.exports = new CommonConfigService();
