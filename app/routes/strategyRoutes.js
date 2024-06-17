const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createStrategyValidatorSchema } = require('../validators/strategyValidator');

const router = express.Router();

// view all strategies
router.get('/strategies', asyncHandler(strategyController.getAllStrategies));

// Create a new strategy
router.post('/strategies', validateParams(createStrategyValidatorSchema), asyncHandler(strategyController.createStrategy));

// view a strategy
router.get('/strategies/:id', asyncHandler(strategyController.getStrategyById));    

// Stop or start a strategy 
router.patch('/strategies/:id', validateParams(updateStrategyValidatorSchema),asyncHandler(strategyController.updateStrategy));

module.exports = router;

