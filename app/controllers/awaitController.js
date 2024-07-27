const AwaitService = require('../services/awaitService');
const ResponseHandler = require('../utils/responseHandler');

class AwaitController {
    /**
     * Carry out sell operations for all orders
     * @param {request} req 
     * @param {response} res 
     */
    async sellAllOrders(req, res) {
        results = await AwaitService.sellAllOrders();
        return ResponseHandler.success(res, results);
    }

}

module.exports = new AwaitController();