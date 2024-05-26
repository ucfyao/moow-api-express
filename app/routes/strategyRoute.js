const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const route = express.Router();

// RESTful API routes for investment strategies
// view all strategies
route.get('/strategies', strategyController.getAllStrategies);
// new a strategy
route.post('/strategies', strategyController.getAllStrategies);

// view a single strategy
route.get('/strategies/:id', strategyController.getStrategyById);    
// update a single strategy 
route.patch('/strategies/:id', strategyController.getStrategyById); 

// view all oder histories of a single strategy
route.get('/oders', oderController.getAlloders); 

module.exports = route;

