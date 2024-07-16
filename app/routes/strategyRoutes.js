const express = require('express');
const StrategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const {
  createStrategyValidatorSchema,
  updateStrategyValidatorSchema,
} = require('../validators/strategyValidator');

const router = express.Router();

// view all strategies
router.get('/api/v1/strategies', asyncHandler(StrategyController.index));

// Create a new strategy
router.post(
  '/api/v1/strategies',
  validateParams(createStrategyValidatorSchema),
  asyncHandler(StrategyController.create),
);

// view a strategy
router.get('/api/v1/strategies/:id', asyncHandler(StrategyController.show));

// update a strategy
router.patch('/api/v1/strategies/:id',
  validateParams(updateStrategyValidatorSchema),
  asyncHandler(StrategyController.patch),
);

// Delete a strategy
router.patch(
  '/api/v1/strategies/:id',
  asyncHandler(StrategyController.destroy),
);

/**
 * Route to execute all buy strategies
 */
router.get('/api/v1/strategies/execute-all-buys', asyncHandler(StrategyController.executeAllBuys));

/**
 * Route to execute a single buy strategy
 * @param {string} strategyId - The ID of the strategy to execute
 */
router.post(
  '/api/v1/strategies/:strategyId/execute-buy',
  asyncHandler(StrategyController.executeBuy),
);

// Route for detecting sell signal and executing the corresponding operation
router.post(
  '/api/v1/strategies/:strategyId/sell-signal',
  asyncHandler(StrategyController.executeSell),
);

module.exports = router;
