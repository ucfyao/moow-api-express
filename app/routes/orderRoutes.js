const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
router.get('/api/v1/orders', asyncHandler(OrderController.getAllOrders));

// Buy a new order for a strategy
router.post('/api/v1/orders', OrderController.place);

// Sell orders for a strategy
router.patch('/api/v1/orders', OrderController.sell);

module.exports = router;