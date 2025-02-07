const express = require('express');
const MarketController = require('../controllers/marketController');
const validateParams = require('../middlewares/validateMiddleware');
const { createMarketValidatorSchema, updateMarketValidatorSchema } = require('../validators/marketValidator');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// get all markets list
/**
 * @swagger
 * /api/v1/markets:
 *   get:
 *     summary: Get a list of all markets
 *     tags:
 *       - Market Management
 *     description: Get all available market information in the system.
 *     responses:
 *       200:
 *         description: Successfully returned to the market list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "market123"
 *                   name:
 *                     type: string
 *                     example: "Binance Futures"
 *                   status:
 *                     type: string
 *                     example: "active"
 */
router.get('/api/v1/markets', asyncHandler(MarketController.index));

// create a new markets
/**
 * @swagger
 * /api/v1/markets:
 *   post:
 *     summary: Creating New Markets
 *     tags:
 *       - Market Management
 *     description: Create a new market record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Binance Futures"
 *               status:
 *                 type: string
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Market creation success
 */
router.post(
  '/api/v1/markets',
  validateParams(createMarketValidatorSchema),
  asyncHandler(MarketController.create),
);

// get a market by ID
/**
 * @swagger
 * /api/v1/markets/{id}:
 *   get:
 *     summary: Get market details
 *     tags:
 *       - Market Management
 *     description: Get information for a single market based on its market ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the market
 *     responses:
 *       200:
 *         description: Successfully returned market information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "market123"
 *                 name:
 *                   type: string
 *                   example: "Binance Futures"
 *                 status:
 *                   type: string
 *                   example: "active"
 */
router.get('/api/v1/markets/:id', asyncHandler(MarketController.show));

// update market info updateMarket
/**
 * @swagger
 * /api/v1/markets/{id}:
 *   put:
 *     summary: Update market information
 *     tags:
 *       - Market Management
 *     description: Updates the market information based on the ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Market Name"
 *               status:
 *                 type: string
 *                 example: "inactive"
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the market
 *     responses:
 *       200:
 *         description: Market information updated successfully
 */
router.put('/api/v1/markets/:id', asyncHandler(MarketController.update));

// delete a market
/**
 * @swagger
 * /api/v1/markets/{id}:
 *   delete:
 *     summary: Delete Market
 *     tags:
 *       - Market Management
 *     description: Deletes the specified market by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the market
 *     responses:
 *       200:
 *         description: Market deleted successfully
 */
router.delete('/api/v1/markets/:id', asyncHandler(MarketController.destroy));

module.exports = router;
