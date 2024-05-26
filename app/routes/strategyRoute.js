const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const strategyRouter = express.Router();

// RESTful API routes for investment strategies
// view all strategies
strategyRouter.get('/strategies', strategyController.getAllStrategies);
// new a strategy
strategyRouter.post('/strategies', strategyController.getAllStrategies);

// view a single strategy
strategyRouter.get('/strategies/:id', strategyController.getStrategyById);    
// update a single strategy 
strategyRouter.patch('/strategies/:id', strategyController.getStrategyById); 

// view all oder histories of a single strategy
strategyRouter.get('/strategies/:id/oders', strategyController.getStrategyById); 

module.exports = strategyRouter;

