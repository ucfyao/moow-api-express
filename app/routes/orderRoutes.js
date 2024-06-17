const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
router.get('/orders', asyncHandler(OrderController.getAllOrders));

// Buy a new order for a strategy
router.post('/orders', OrderController.buyNewOrder);

module.exports = router;