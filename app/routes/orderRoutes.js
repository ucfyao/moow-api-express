const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
router.get('/api/v1/orders', asyncHandler(OrderController.index));

// New order for a strategy
router.post('/api/v1/orders', asyncHandler(OrderController.create));

// Fetch all open orders
router.get('/api/v1/openOders', asyncHandler(OrderController.listThirdPartyOrders));

// Cancel all open orders
router.delete('/api/v1/openOrders', asyncHandler(OrderController.cancelAllOpenThirdPartyOrders));
module.exports = router;
