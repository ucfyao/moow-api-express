const express = require('express');
const PurchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const { submitPurchaseValidatorSchema } = require('../validators/purchaseValidator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/purchases:
 *   post:
 *     summary: Submit a new purchase
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eth_address, tx_hash, amount]
 *             properties:
 *               eth_address:
 *                 type: string
 *               tx_hash:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       201:
 *         description: Purchase submitted
 */
router.post(
  '/api/v1/purchases',
  authMiddleware,
  validateParams(submitPurchaseValidatorSchema),
  PurchaseController.submit
);

/**
 * @swagger
 * /api/v1/purchases:
 *   get:
 *     summary: List all purchases (admin)
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Purchase list
 */
router.get('/api/v1/purchases', authMiddleware, PurchaseController.index);

/**
 * @swagger
 * /api/v1/purchases/{id}:
 *   get:
 *     summary: Get purchase details
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase details
 */
router.get('/api/v1/purchases/:id', authMiddleware, PurchaseController.show);

/**
 * @swagger
 * /api/v1/purchases/{id}:
 *   patch:
 *     summary: Update purchase status/comment (admin)
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase updated
 */
router.patch('/api/v1/purchases/:id', authMiddleware, PurchaseController.update);

/**
 * @swagger
 * /api/v1/purchases/{id}/promote:
 *   post:
 *     summary: Credit purchase to user account (admin)
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase promoted and VIP extended
 */
router.post('/api/v1/purchases/:id/promote', authMiddleware, PurchaseController.promote);

module.exports = router;
