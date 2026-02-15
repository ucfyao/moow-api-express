const ccxt = require('ccxt');
const dayjs = require('dayjs');
const DataBtcHistoryModel = require('../models/dataBtcHistoryModel');
const CommonConfigModel = require('../models/commonConfigModel');
const AipOrderModel = require('../models/aipOrderModel');
const logger = require('../utils/logger');

class HomeService {
  /**
   * Get BTC price history for homepage chart.
   * Returns up to `limit` recent daily data points sorted by date ascending.
   * @param {object} params
   * @param {number} [params.limit=365] - Max data points to return
   * @returns {Promise<{list: Array}>}
   */
  async getBtcHistory(params = {}) {
    const limit = params.limit || 365;

    const list = await DataBtcHistoryModel.find({}).sort({ date: -1 }).limit(limit).lean();

    // Return in chronological order (oldest first) for chart rendering
    list.reverse();

    return { list };
  }

  /**
   * Get public DCA demo order list (the showcase strategy orders).
   * Reads the configured dingtou_id from common_configs and returns its orders.
   * @returns {Promise<{list: Array}>}
   */
  async getDingtouOrders() {
    const config = await CommonConfigModel.findOne({ name: 'dingtou_id' }).lean();
    const dingtouId = config ? config.content : null;

    if (!dingtouId) {
      return { list: [] };
    }

    const list = await AipOrderModel.find({ strategy_id: dingtouId })
      .sort({ created_at: 1 })
      .lean();

    return { list };
  }

  /**
   * Fetch the latest BTC/USDT daily OHLCV from Binance via CCXT and upsert into DB.
   * Called by the btcHistoryScheduler cron job.
   * @returns {Promise<number>} Number of records upserted
   */
  async fetchAndStoreBtcPrice() {
    // eslint-disable-next-line new-cap
    const exchange = new ccxt.binance({ enableRateLimit: true });

    // Fetch last 2 days of daily candles to ensure we capture today's closing
    const since = dayjs().subtract(2, 'day').startOf('day').valueOf();
    const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1d', since, 2);

    if (!ohlcv || ohlcv.length === 0) {
      logger.warn('btcHistoryScheduler: No OHLCV data returned from exchange');
      return 0;
    }

    const bulkOps = ohlcv.map((candle) => {
      const [timestamp, open, high, low, close, volume] = candle;
      const date = dayjs(timestamp).format('YYYY-MM-DD');

      return {
        updateOne: {
          filter: { date },
          update: {
            $set: { open, high, low, close, volume, exchange: 'binance', symbol: 'BTC/USDT' },
          },
          upsert: true,
        },
      };
    });

    const result = await DataBtcHistoryModel.bulkWrite(bulkOps);
    const upsertedCount = result.upsertedCount + result.modifiedCount;

    logger.info(`btcHistoryScheduler: upserted ${upsertedCount} BTC history records`);
    return upsertedCount;
  }
}

module.exports = new HomeService();
