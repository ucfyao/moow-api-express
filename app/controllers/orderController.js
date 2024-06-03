const OrderService = require('../services/orderService');
const ResponseHandler = require('../utils/responseHandler');
const { STATUS_TYPE } = require('../utils/statusCodes');

class OrderController {
    async getAllOrders(req, res) {
        try {
            const { strategy_id } = req.query;
            if (!strategy_id) {
                ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, 'strategy_id is required');
            }
            const orders = await OrderService.getAllOrders(strategy_id);
            if ( orders ) {
                ResponseHandler.success(res, strategy);
            } else {
                ResponseHandler.fail(res, STATUS_TYPE.notFound, STATUS_TYPE.notFound, 'Orders not found');
            }
        } catch (error) {
            ResponseHandler.fail(res, STATUS_TYPE.internalError, STATUS_TYPE.internalError, error.message);
        }
    }
}

module.exports = new OrderController();