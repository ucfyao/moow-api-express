const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createStrategyValidatorSchema, updateStrategyValidatorSchema } = require('../validators/strategyValidator');

const router = express.Router();

// view all strategies
router.get('/api/v1/strategies', asyncHandler(strategyController.getAllStrategies));

// Create a new strategy
router.post('/api/v1/strategies', validateParams(createStrategyValidatorSchema), asyncHandler(strategyController.createStrategy));

// view a strategy
router.get('/api/v1/strategies/:id', asyncHandler(strategyController.getStrategyById));

// Stop or start a strategy 
router.patch('/api/v1/strategies/:id', validateParams(updateStrategyValidatorSchema),asyncHandler(strategyController.updateStrategy));

module.exports = router;

