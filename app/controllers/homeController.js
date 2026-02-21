const mongoose = require('mongoose');
const { hashidsEncode, hashidsDecode } = require('../utils/hashidsHandler');
const HomeService = require('../services/homeService');
const ResponseHandler = require('../utils/responseHandler');
const { getStatus: getSchedulerStatus } = require('../utils/schedulerRegistry');

const READY_STATE_MAP = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

class HomeController {
  async index(req, res) {
    res.send('service is live');
  }

  async test(req, res) {
    const x = hashidsEncode(1);
    const y = hashidsDecode(x);
    res.json({ x, y });
  }

  async health(req, res) {
    const { readyState } = mongoose.connection;
    const mongoStatus = READY_STATE_MAP[readyState] || 'disconnected';

    let status = 'ok';
    if (readyState === 0) {
      status = 'error';
    } else if (readyState === 2 || readyState === 3) {
      status = 'degraded';
    }

    const memUsage = process.memoryUsage();

    const body = {
      status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mongodb: {
        status: mongoStatus,
        readyState,
      },
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
      schedulers: getSchedulerStatus(),
    };

    const httpCode = status === 'ok' ? 200 : 503;
    res.status(httpCode).json(body);
  }

  /**
   * GET /api/v1/public/btc-history
   * Returns BTC price history for the homepage chart.
   */
  async getBtcHistory(req, res) {
    const params = req.query;
    const data = await HomeService.getBtcHistory(params);
    return ResponseHandler.success(res, data);
  }

  /**
   * GET /api/v1/public/dingtou/orders
   * Returns the public DCA demo order list.
   */
  async getDingtouOrders(req, res) {
    const data = await HomeService.getDingtouOrders();
    return ResponseHandler.success(res, data);
  }
}
module.exports = new HomeController();
