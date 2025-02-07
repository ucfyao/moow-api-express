// routes/ExchangeKeyRoutes.js
const express = require('express');
const ExchangeKeyController = require('../controllers/exchangeKeyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createKeyValidatorSchema, updateKeyValidatorSchema } = require('../validators/exchangeKeyValidator');

const router = express.Router();


/**
 * @swagger
 * /api/v1/keys:
 *   get:
 *     summary: Get all transaction keys
 *     tags:
 *       - Exchange Key Management
 *     description: Get all stored transaction keys
 *     responses:
 *       200:
 *         description: All transaction keys are returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "abc123"
 *                   exchange:
 *                     type: string
 *                     example: "Binance"
 *                   apiKey:
 *                     type: string
 *                     example: "your-api-key"
 */
router.get('/api/v1/keys', asyncHandler(ExchangeKeyController.index));

/**
 * @swagger
 * /api/v1/keys:
 *   post:
 *     summary: Create transaction keys
 *     tags:
 *       - Exchange Key Management
 *     description: Create a new transaction key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exchange:
 *                 type: string
 *                 example: "Binance"
 *               apiKey:
 *                 type: string
 *                 example: "your-api-key"
 *               secretKey:
 *                 type: string
 *                 example: "your-secret-key"
 *     responses:
 *       201:
 *         description: Transaction key created successfully
 */
router.post(
  '/api/v1/keys',
  validateParams(createKeyValidatorSchema),
  asyncHandler(ExchangeKeyController.create),
);

/**
 * @swagger
 * /api/v1/keys:
 *   put:
 *     summary: Update transaction key
 *     tags:
 *       - Exchange Key Management
 *     description: Update a transaction key information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "abc123"
 *               apiKey:
 *                 type: string
 *                 example: "updated-api-key"
 *               secretKey:
 *                 type: string
 *                 example: "updated-secret-key"
 *     responses:
 *       200:
 *         description: Transaction key updated successfully
 */
router.put(
  '/api/v1/keys',
  validateParams(updateKeyValidatorSchema),
  asyncHandler(ExchangeKeyController.update),
);

/**
 * @swagger
 * /api/v1/keys/{id}:
 *   get:
 *     summary: Get the specified transaction key
 *     tags:
 *       - Exchange Key Management
 *     description: Get information about a single transaction key based on its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the transaction key
 *     responses:
 *       200:
 *         description: Transaction key information returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 exchange:
 *                   type: string
 *                   example: "Binance"
 *                 apiKey:
 *                   type: string
 *                   example: "your-api-key"
 */
router.get('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.show));

/**
 * @swagger
 * /api/v1/keys/{id}:
 *   delete:
 *     summary: Deleting a transaction key
 *     tags:
 *       - Exchange Key Management
 *     description: Delete the specified transaction key by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the transaction key
 *     responses:
 *       200:
 *         description: Transaction key deleted successfullyK
 */
router.delete('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.destroy));

module.exports = router;
