const PurchaseModel = require('../models/purchaseModel');
const PortalUserModel = require('../models/portalUserModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const logger = require('../utils/logger');

class PurchaseService {
  async submit(userId, data) {
    const user = await PortalUserModel.findById(userId).select('email ref').lean();
    const purchase = new PurchaseModel({
      user: userId,
      eth_address: data.eth_address,
      tx_hash: data.tx_hash,
      amount: data.amount,
      email: user ? user.email : '',
      ref: user ? user.ref : '',
    });
    await purchase.save();
    return { _id: purchase._id };
  }

  async getAllPurchases(params = {}) {
    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 20;
    const conditions = {};
    if (params.keyword) {
      conditions.$or = [
        { eth_address: { $regex: params.keyword, $options: 'i' } },
        { tx_hash: { $regex: params.keyword, $options: 'i' } },
        { email: { $regex: params.keyword, $options: 'i' } },
      ];
    }
    const total = await PurchaseModel.countDocuments(conditions);
    const list = await PurchaseModel.find(conditions)
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    return { list, pageNumber, pageSize, total };
  }

  async getPurchaseById(id) {
    const purchase = await PurchaseModel.findById(id)
      .select('user eth_address tx_hash amount status comment email')
      .lean();
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }
    return purchase;
  }

  async updatePurchase(id, data) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }
    if (data.status !== undefined) purchase.status = data.status;
    if (data.comment !== undefined) purchase.comment = data.comment;
    await purchase.save();
    return { _id: purchase._id };
  }

  async promotePurchase(id) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }

    const user = await PortalUserModel.findById(purchase.user);
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    // Calculate VIP duration: amount * 10 months, 20% bonus if >= 2 months
    let addMonths = parseFloat(purchase.amount) * 10;
    if (addMonths >= 2) {
      addMonths = Math.floor(addMonths * 1.2);
    }

    const baseDate =
      user.vip_time_out_at && user.vip_time_out_at > new Date() ? user.vip_time_out_at : new Date();
    user.vip_time_out_at = new Date(baseDate.getTime() + addMonths * 31 * 24 * 60 * 60 * 1000);

    purchase.status = PurchaseModel.STATUS_SUCCESS;
    await purchase.save();
    await user.save();

    logger.info(`[promote] Purchase ${id}: +${addMonths} months VIP for user ${user.email}`);
    return { _id: purchase._id, vip_time_out_at: user.vip_time_out_at };
  }
}

module.exports = new PurchaseService();
