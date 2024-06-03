const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');
const createStrategyValidatorSchema = require('../validators/createStrategyValidator');
const asyncHandler = require('../utils/asyncHandler');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const router = express.Router();

// RESTful API routes for investment strategies
// view all strategies
router.get('/strategies', asyncHandler(strategyController.getAllStrategies));

// Create a new strategy
router.post('/strategies', validateParams(createStrategyValidatorSchema), asyncHandler(strategyController.createStrategy));

// view a strategy
router.get('/strategies/:id', asyncHandler(strategyController.getStrategyById));    

// update a strategy 
// router.patch('/strategies/:id',  
//     validateParams(updateStrategyValidatorSchema),
//     strategyController.updateStrategy); 


module.exports = router;

