const express = require('express');
const OrderController = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// View all orders of a strategy
/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders
 *     tags:
 *       - Orders Management
 *     description: Get a list of orders for all current strategies.
 *     responses:
 *       200:
 *         description: Successfully returned the order list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "order123"
 *                   strategy:
 *                     type: string
 *                     example: "Mean Reversion"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *                   price:
 *                     type: number
 *                     example: 105.5
 *                   quantity:
 *                     type: number
 *                     example: 2
 */
router.get('/api/v1/orders', asyncHandler(OrderController.index));

// Fetch all open orders
/**
 * @swagger
 * /api/v1/openOrders:
 *   get:
 *     summary: Get all uncompleted orders
 *     tags:
 *       - Orders Management
 *     description: Get all outstanding orders (including third-party orders).
 *     responses:
 *       200:
 *         description: Successfully returned a list of uncompleted orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "order456"
 *                   market:
 *                     type: string
 *                     example: "Binance Futures"
 *                   status:
 *                     type: string
 *                     example: "open"
 *                   price:
 *                     type: number
 *                     example: 2500.75
 *                   quantity:
 *                     type: number
 *                     example: 1.5
 */
router.get('/api/v1/openOders', asyncHandler(OrderController.listThirdPartyOrders));

// Cancel all open orders
/**
 * @swagger
 * /api/v1/openOrders:
 *   delete:
 *     summary: Cancel all outstanding orders
 *     tags:
 *       - Orders Management
 *     description: Cancel all outstanding orders (including third-party orders).
 *     responses:
 *       200:
 *         description: All outstanding orders have been cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All open orders have been cancelled successfully"
 */
router.delete('/api/v1/openOrders', asyncHandler(OrderController.cancelAllOpenThirdPartyOrders));

module.exports = router;
