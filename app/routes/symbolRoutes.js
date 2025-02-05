const express = require('express');
const SymbolController = require('../controllers/symbolController');
const asyncHandler = require('../utils/asyncHandler');
const validateParams = require('../middlewares/validateMiddleware');
const { dateValidatorSchema, loaderValidatorSchema } = require('../validators/symbolValidator');

const router = express.Router();

// get a list of all data exchange symbol
/**
 * @swagger
 * /api/v1/symbols:
 *   get:
 *     summary: Get all trading pair information
 *     tags:
 *       - Symbols Management
 *     description: Get all available trading pairs (symbols).
 *     responses:
 *       200:
 *         description: Successfully returned the trading pair list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "symbol123"
 *                   name:
 *                     type: string
 *                     example: "BTC/USDT"
 *                   exchange:
 *                     type: string
 *                     example: "Binance"
 */
router.get('/api/v1/symbols', asyncHandler(SymbolController.index));

// view a symbol by id
/**
 * @swagger
 * /api/v1/symbols/{id}:
 *   get:
 *     summary: Get the details of the specified transaction pair
 *     tags:
 *       - Symbols Management
 *     description: Get detailed information of a specific trading pair by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the trading pair
 *     responses:
 *       200:
 *         description: Successfully returned transaction pair details
 */
router.get('/api/v1/symbols/:id', asyncHandler(SymbolController.show));

// For test, so there's no validator
// Create a new data exchange symbol
/**
 * @swagger
 * /api/v1/symbols:
 *   post:
 *     summary: Create a new trading pair
 *     tags:
 *       - Symbols Management
 *     description: Add a new trading pair (symbol).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "ETH/USDT"
 *               exchange:
 *                 type: string
 *                 example: "Binance"
 *     responses:
 *       201:
 *         description: Trading pair created successfully
 */
router.post('/api/v1/symbols', asyncHandler(SymbolController.create));

/**
 * @swagger
 * /api/v1/symbols/getPrice:
 *   post:
 *     summary: Get the price of the trading pair
 *     tags:
 *       - Symbols price query
 *     description: Get price data for a specified trading pair within a specific time range.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "BTC/USDT"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-10"
 *     responses:
 *       200:
 *         description: Successfully returned price data
 */
router.post(
  '/api/v1/symbols/getPrice',   
  validateParams(dateValidatorSchema),
  asyncHandler(SymbolController.getPrice));

/**
 * @swagger
 * /api/v1/symbols/priceLoader:
 *   post:
 *     summary: Batch loading trading pair price data
 *     tags:
 *       - Symbols price query
 *     description: Batch load trading pair price data from a database or external API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["BTC/USDT", "ETH/USDT"]
 *               timeFrame:
 *                 type: string
 *                 example: "1d"
 *     responses:
 *       200:
 *         description: Price data loaded successfully
 */
router.post(
  '/api/v1/symbols/priceLoader', 
  validateParams(loaderValidatorSchema),
  asyncHandler(SymbolController.loadPrice))
module.exports = router;