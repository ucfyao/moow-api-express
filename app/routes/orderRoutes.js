const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const OrderController = require('../controllers/orderController');
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
router.get('/api/v1/orders', authMiddleware, OrderController.index);

// Get order detail by id
/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order detail
 *     tags:
 *       - Orders Management
 *     description: Get a single order by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully returned the order detail
 *       404:
 *         description: Order not found
 */
router.get('/api/v1/orders/:id', authMiddleware, OrderController.show);

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
router.get('/api/v1/openOrders', authMiddleware, OrderController.listThirdPartyOrders);

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
router.delete('/api/v1/openOrders', authMiddleware, OrderController.cancelAllOpenThirdPartyOrders);

module.exports = router;
