const { v1: uuidv1 } = require('uuid');
const AssetsUserOrderModel = require('../models/assetsUserOrderModel');
const PortalUserModel = require('../models/portalUserModel');
const logger = require('../utils/logger');

class AssetsService {
  /**
   * Send tokens from one user to another
   * @param {Object} params - { from, email, amount, token, describe, invitee, invitee_email }
   * @returns {Object|false} Updated recipient user or false if failed
   */
  async sendToken(params) {
    const { from, email, amount, token, describe, invitee, invitee_email: inviteeEmail } = params;

    const sender = await PortalUserModel.findById(from);
    const recipient = await PortalUserModel.findOne({ email });

    // Validate both users exist
    if (!sender || !recipient) {
      await this._createOrder({
        from,
        to: recipient ? recipient._id : '',
        amount,
        token,
        describe,
        invitee,
        invitee_email: inviteeEmail,
        from_balance: sender ? sender.XBT : '0',
        to_balance: recipient ? recipient.XBT : '0',
        status: 'error',
        status_describe: !sender ? 'Sender not found' : 'Recipient not found',
      });
      return false;
    }

    // Validate sender balance
    const senderBalance = parseFloat(sender.XBT || '0');
    const transferAmount = parseFloat(amount || '0');
    if (senderBalance < transferAmount) {
      await this._createOrder({
        from: sender._id,
        to: recipient._id,
        amount,
        token,
        describe,
        invitee,
        invitee_email: inviteeEmail,
        from_balance: sender.XBT,
        to_balance: recipient.XBT,
        status: 'error',
        status_describe: 'Insufficient balance',
      });
      return false;
    }

    // Execute transfer
    const newSenderBalance = senderBalance - transferAmount;
    const newRecipientBalance = parseFloat(recipient.XBT || '0') + transferAmount;

    sender.XBT = String(newSenderBalance);
    recipient.XBT = String(newRecipientBalance);
    await sender.save();
    await recipient.save();

    await this._createOrder({
      from: sender._id,
      to: recipient._id,
      amount,
      token,
      describe,
      invitee,
      invitee_email: inviteeEmail,
      from_balance: sender.XBT,
      to_balance: recipient.XBT,
      status: 'success',
      status_describe: 'Transfer completed',
    });

    logger.info(`[sendToken] ${amount} ${token} from ${sender.email} to ${recipient.email}`);
    return recipient;
  }

  async _createOrder(data) {
    const order = new AssetsUserOrderModel({
      order_id: uuidv1(),
      ...data,
    });
    await order.save();
    return order;
  }
}

module.exports = new AssetsService();
