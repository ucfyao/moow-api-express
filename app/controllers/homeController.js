const { hashidsEncode, hashidsDecode } = require('../utils/hashidsHandler');
const HomeService = require('../services/homeService');
const ResponseHandler = require('../utils/responseHandler');

class HomeController {
  async index(req, res) {
    res.send('service is live');
  }

  async test(req, res) {
    const x = hashidsEncode(1);
    const y = hashidsDecode(x);
    res.json({ x, y });
  }

  // Route to check the status of the scheduled task
  async checkTask(req, res) {
    // const taskStatus = task.getStatus(); // Returns the status of the scheduled task
    res.json({ status: true });
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
