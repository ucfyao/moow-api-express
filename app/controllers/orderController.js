const OrderService = require('../services/orderService');
const ResponseHandler = require('../utils/responseHandler');

class OrderController {
  async getAllOrders(req, res) {
    const { strategy_id } = req.query;
    const orders = await OrderService.getAllOrders(strategy_id);
    return ResponseHandler.success(res, orders);
  }
}

module.exports = new OrderController();
