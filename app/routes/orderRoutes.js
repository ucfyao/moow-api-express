const express = require('express');
const OrderController = require('../controllers/orderController');
const validateParams = require('../middlewares/validateMiddleware');

const router = express.Router();

router.get('/orders', OrderController.getAllOrders);

module.exports = router;