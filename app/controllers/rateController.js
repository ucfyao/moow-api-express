const RateService = require('../services/rateService');
const ResponseHandler = require('../utils/responseHandler');

class RateController {
  async rmbRateList(req, res) {
    const data = await RateService.getRmbRateList();
    return ResponseHandler.success(res, data);
  }
}

module.exports = new RateController();
