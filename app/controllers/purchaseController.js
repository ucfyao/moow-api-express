const PurchaseService = require('../services/purchaseService');
const ResponseHandler = require('../utils/responseHandler');

class PurchaseController {
  async submit(req, res) {
    const data = await PurchaseService.submit(req.userId, req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async index(req, res) {
    const data = await PurchaseService.getAllPurchases(req.query);
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await PurchaseService.getPurchaseById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async update(req, res) {
    const data = await PurchaseService.updatePurchase(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async promote(req, res) {
    const data = await PurchaseService.promotePurchase(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new PurchaseController();
