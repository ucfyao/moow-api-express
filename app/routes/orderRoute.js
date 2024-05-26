const express = require('express');
const orderController = require('../controllers/orderController');
const validateParams = require('../middlewares/validateMiddleware');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const route = express.Router();

// RESTful API routes for investment strategies
// view all oder histories of a single strategy
route.get('/orders?strategy_id=:strategy_id', orderController.getOrders); 

module.exports = route;