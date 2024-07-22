const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
router.get('/api/v1/orders', asyncHandler(OrderController.index));

// New order for a strategy
router.post('/api/v1/orders', asyncHandler(OrderController.create));

// Cancel all open orders
router.delete('/api/v1/openOrders', asyncHandler(OrderController.cancelAllOpenOrders));
module.exports = router;
