const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
router.get('/api/v1/orders', asyncHandler(OrderController.getAllOrders));

// New order for a strategy
router.post('/api/v1/orders', asyncHandler(OrderController.create));

module.exports = router;