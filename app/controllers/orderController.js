const OrderService = require('../services/orderService');
const ResponseHandler = require('../utils/responseHandler');

class OrderController {
  async index(req, res) {
    const { strategy_id } = req.query;
    const orders = await OrderService.getAllOrders(strategy_id);
    return ResponseHandler.success(res, orders);
  }

  async statistics(req, res) {
    const data = await OrderService.getOrderStatistics(req.userId);
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const { id } = req.params;
    const order = await OrderService.getOrderById(id);
    return ResponseHandler.success(res, order);
  }

  async listThirdPartyOrders(req, res) {
    const { exchangeName, symbol, apiKey, secret } = req.query;
    const oders = await OrderService.getThirdPartyOrders(exchangeName, symbol, apiKey, secret);
    return ResponseHandler.success(res, oders);
  }

  async cancelAllOpenThirdPartyOrders (req, res) {
    const { exchangeName, symbol, apiKey, secret } = req.query;
    const orders = await OrderService.cancelAllOpenThirdPartyOrders(exchangeName, symbol, apiKey, secret);
    return ResponseHandler.success(res, orders);
  }
}

module.exports = new OrderController();
