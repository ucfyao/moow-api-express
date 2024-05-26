const express = require('express');
const oderController = require('../controllers/oderController');
const validateParams = require('../middlewares/validateMiddleware');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const route = express.Router();

// RESTful API routes for investment strategies
// view all oder histories of a single strategy
route.get('/oders', oderController.getAllorders); 
route.get('/oders?id=:id', oderController.getOrderById); 

module.exports = route;