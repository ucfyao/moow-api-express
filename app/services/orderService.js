const Order = require('../models/orderModel');

class OrderService {

    async getAllOrders(strategy_id) {
        const start = Date.now();
        const pageNumber = 1;
        const pageSize = 9999;
        const query = Order.find({ strategy_id: strategy_id });
        return query.sort({ createdAt: 1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();
    }

}

module.exports = new OrderService();