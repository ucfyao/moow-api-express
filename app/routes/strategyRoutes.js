const express = require('express');
const StrategyController = require('../controllers/strategyController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const {
  createStrategyValidatorSchema,
  updateStrategyValidatorSchema,
} = require('../validators/strategyValidator');

const router = express.Router();

// Public endpoint: DCA orders for homepage chart (no auth)
/**
 * @swagger
 * /api/v1/public/dingtou/orders:
 *   post:
 *     summary: Get public DCA order data for homepage chart
 *     tags:
 *       - Trading strategy management
 *     responses:
 *       200:
 *         description: Recent buy orders list
 */
router.post('/api/v1/public/dingtou/orders', StrategyController.getPublicOrders);

// Summary must be defined BEFORE /:id to avoid matching "summary" as an id
/**
 * @swagger
 * /api/v1/strategies/summary:
 *   get:
 *     summary: Get summary of all user's active strategies
 *     tags:
 *       - Trading strategy management
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Strategy summary statistics
 */
router.get('/api/v1/strategies/summary', authMiddleware, StrategyController.getSummary);

// view all strategies
/**
 * @swagger
 * /api/v1/strategies:
 *   get:
 *     summary: Get all trading strategies
 *     tags:
 *       - Trading strategy management
 *     description: Get a list of all created trading strategies.
 *     responses:
 *       200:
 *         description: Successfully returned a list of policies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "strategy123"
 *                   name:
 *                     type: string
 *                     example: "Mean Reversion"
 *                   status:
 *                     type: string
 *                     example: "active"
 */
router.get('/api/v1/strategies', authMiddleware, StrategyController.index);

// Create a new strategy
/**
 * @swagger
 * /api/v1/strategies:
 *   post:
 *     summary: Create a new trading strategy
 *     tags:
 *       - Trading strategy management
 *     description: Create a new trading strategy.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Momentum Strategy"
 *               parameters:
 *                 type: object
 *                 example: { "threshold": 0.5, "duration": "1h" }
 *     responses:
 *       201:
 *         description: Strategy created successfully
 */
router.post(
  '/api/v1/strategies',
  authMiddleware,
  validateParams(createStrategyValidatorSchema),
  StrategyController.create
);

// view a strategy
/**
 * @swagger
 * /api/v1/strategies/{id}:
 *   get:
 *     summary: Get the specified trading strategy
 *     tags:
 *       - Trading strategy management
 *     description: Get details for a single policy by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Successfully returned policy details
 */
router.get('/api/v1/strategies/:id', authMiddleware, StrategyController.show);

// Get exchange balance for a strategy
/**
 * @swagger
 * /api/v1/strategies/{id}/balance:
 *   get:
 *     summary: Get exchange balance for a strategy's trading pair
 *     tags:
 *       - Trading strategy management
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Balance information
 */
router.get('/api/v1/strategies/:id/balance', authMiddleware, StrategyController.getBalance);

// update a strategy
/**
 * @swagger
 * /api/v1/strategies/{id}:
 *   patch:
 *     summary: Update trading strategy
 *     tags:
 *       - Trading strategy management
 *     description: Updates the specified trading strategy information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Strategy Name"
 *               parameters:
 *                 type: object
 *                 example: { "threshold": 0.3, "duration": "2h" }
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Policy information updated successfully
 */
router.patch(
  '/api/v1/strategies/:id',
  authMiddleware,
  validateParams(updateStrategyValidatorSchema),
  StrategyController.patch
);

// soft delete a strategy
/**
 * @swagger
 * /api/v1/strategies/{id}:
 *   delete:
 *     summary: Deleting a Trading Strategy
 *     tags:
 *       - Trading strategy management
 *     description: Soft deletes the specified trading strategy, making it unavailable but still present in the database.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Policy deleted successfully
 */
router.delete('/api/v1/strategies/:id', authMiddleware, StrategyController.destory);

/**
 * @swagger
 * /api/v1/strategies/execute-all-buys:
 *   post:
 *     summary: Execute all buy strategies
 *     tags:
 *       - Trading strategy execution
 *     description: Trigger buy signals for all trading strategies and execute corresponding buy operations.
 *     responses:
 *       200:
 *         description: All buy strategies were executed successfully
 */
router.post(
  '/api/v1/strategies/execute-all-buys',
  authMiddleware,
  StrategyController.executeAllBuys
);

/**
 * @swagger
 * /api/v1/strategies/{strategyId}/execute-buy:
 *   post:
 *     summary: Execute the specified buy strateg
 *     tags:
 *       - Trading strategy execution
 *     description: Trigger a buy signal for the specified trading strategy and execute a buy operation.
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Buy strategy executed successfully
 */
router.post(
  '/api/v1/strategies/:strategyId/execute-buy',
  authMiddleware,
  StrategyController.executeBuy
);

/**
 * @swagger
 * /api/v1/strategies/execute-all-sells:
 *   post:
 *     summary: Execute all sell strategies
 *     tags:
 *       - Trading strategy execution
 *     description: Trigger sell signals for all trading strategies and execute corresponding sell operations.
 *     responses:
 *       200:
 *         description: All selling strategies were executed successfully
 */
router.post(
  '/api/v1/strategies/execute-all-sells',
  authMiddleware,
  StrategyController.executeAllSells
);

/**
 * @swagger
 * /api/v1/strategies/{strategyId}/execute-sell:
 *   post:
 *     summary: Execute the specified selling strategy
 *     tags:
 *       - Trading strategy execution
 *     description: Trigger a sell signal for the specified trading strategy and execute a sell operation.
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading strategy
 *     responses:
 *       200:
 *         description: Sell ​​strategy executed successfully
 */
router.post(
  '/api/v1/strategies/:strategyId/execute-sell',
  authMiddleware,
  StrategyController.executeSell
);

module.exports = router;
