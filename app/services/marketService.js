const Market = require('../models/marketModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

class MarketService {
  async getAllMarkets(params = {}) {
    let conditions = {
      is_deleted: false,
    };

    const { keyword } = params;
    // search
    if (typeof keyword !== 'undefined') {
      conditions = Object.assign(conditions, {
        $or: [{ name: new RegExp(keyword, 'i') }, { exchange: new RegExp(keyword, 'i') }],
      });
    }

    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 9999;

    const query = Market.find(conditions);
    const markets = await query
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    const total = await Market.find(conditions).countDocuments();

    return {
      list: markets,
      pageNumber,
      pageSize,
      total,
    };
  }

  async getMarketById(id) {
    const market = await Market.findById(id);
    if (!market) {
      throw new CustomError(STATUS_TYPE.PORTAL_MARKET_NOT_FOUND);
    }
    return market;
  }

  async createMarket(market) {
    const newMarket = await new Market(market).save();
    const marketId = newMarket ? newMarket._id : '';

    return { _id: marketId };
  }

  async updateMarket(id, market) {
    const existingMarket = await Market.findById(id);

    if (!existingMarket) {
      throw new CustomError(STATUS_TYPE.PORTAL_MARKET_NOT_FOUND);
    }

    if (market.name) existingMarket.name = market.name;
    if (market.exchange) existingMarket.exchange = market.exchange;
    if (market.url) existingMarket.url = market.url;

    await existingMarket.save();

    return { _id: existingMarket._id };
  }

  // soft delete
  async deleteMarket(id) {
    const market = await Market.findById(id);
    if (!market) {
      throw new CustomError(STATUS_TYPE.PORTAL_MARKET_NOT_FOUND);
    }

    market.is_deleted = true;
    await market.save();
    return { _id: id };
  }
}

module.exports = new MarketService();
