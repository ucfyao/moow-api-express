const express = require('express');
const ArbitrageController = require('../controllers/arbitrageController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const { saveConfigValidatorSchema } = require('../validators/arbitrageValidator');

const router = express.Router();

// --- Public routes (no auth required) ---

/**
 * @swagger
 * /api/v1/arbitrage/tickers:
 *   get:
 *     summary: Get recent ticker data
 *     tags:
 *       - Arbitrage
 *     parameters:
 *       - in: query
 *         name: minutes
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Time window in minutes
 *     responses:
 *       200:
 *         description: Ticker data
 */
router.get('/api/v1/arbitrage/tickers', ArbitrageController.getTickers);

/**
 * @swagger
 * /api/v1/arbitrage/opportunities:
 *   get:
 *     summary: Get arbitrage opportunities
 *     tags:
 *       - Arbitrage
 *     parameters:
 *       - in: query
 *         name: minProfit
 *         schema:
 *           type: number
 *           default: 1
 *         description: Minimum profit percentage
 *     responses:
 *       200:
 *         description: Arbitrage opportunity list sorted by diff% descending
 */
router.get('/api/v1/arbitrage/opportunities', ArbitrageController.getOpportunities);

/**
 * @swagger
 * /api/v1/arbitrage/tickers/by-exchange:
 *   get:
 *     summary: Get tickers grouped by exchange
 *     tags:
 *       - Arbitrage
 */
router.get('/api/v1/arbitrage/tickers/by-exchange', ArbitrageController.getTickersByExchange);

/**
 * @swagger
 * /api/v1/arbitrage/tickers/by-symbol:
 *   get:
 *     summary: Get tickers grouped by symbol
 *     tags:
 *       - Arbitrage
 */
router.get('/api/v1/arbitrage/tickers/by-symbol', ArbitrageController.getTickersBySymbol);

// --- Protected routes (auth required) ---

/**
 * @swagger
 * /api/v1/arbitrage/config:
 *   get:
 *     summary: Get user's arbitrage config
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/config', authMiddleware, ArbitrageController.getConfig);

/**
 * @swagger
 * /api/v1/arbitrage/config:
 *   put:
 *     summary: Save user's arbitrage config
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.put(
  '/api/v1/arbitrage/config',
  authMiddleware,
  validateParams(saveConfigValidatorSchema),
  ArbitrageController.saveConfig,
);

/**
 * @swagger
 * /api/v1/arbitrage/exchanges:
 *   get:
 *     summary: Get all CCXT supported exchanges
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/exchanges', authMiddleware, ArbitrageController.getAllExchanges);

/**
 * @swagger
 * /api/v1/arbitrage/symbols:
 *   get:
 *     summary: Get cached symbols
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.get('/api/v1/arbitrage/symbols', authMiddleware, ArbitrageController.getAllSymbols);

/**
 * @swagger
 * /api/v1/arbitrage/symbols/refresh:
 *   post:
 *     summary: Refresh symbol cache from exchanges
 *     tags:
 *       - Arbitrage
 *     security:
 *       - tokenAuth: []
 */
router.post('/api/v1/arbitrage/symbols/refresh', authMiddleware, ArbitrageController.refreshSymbols);

module.exports = router;
