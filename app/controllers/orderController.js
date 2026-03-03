const OrderService = require('../services/orderService');
const ResponseHandler = require('../utils/responseHandler');

class OrderController {
  async index(req, res) {
    const { strategy_id: strategyId } = req.query;
    const orders = await OrderService.getAllOrders(strategyId);
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
    const { keyId, symbol } = req.query;
    const orders = await OrderService.getThirdPartyOrders(keyId, symbol);
    return ResponseHandler.success(res, orders);
  }

  async cancelAllOpenThirdPartyOrders(req, res) {
    const { keyId, symbol } = req.query;
    const orders = await OrderService.cancelAllOpenThirdPartyOrders(keyId, symbol);
    return ResponseHandler.success(res, orders);
  }
}

module.exports = new OrderController();
