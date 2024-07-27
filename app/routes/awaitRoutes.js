const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AwaitController = require('../controllers/awaitController');


const router = express.Router();

/**
 * Carry out sell operations for all orders
 */
router.get('/api/v1/await/sell-all-orders',asyncHandler(AwaitController.sellAllOrders));

module.exports = router;