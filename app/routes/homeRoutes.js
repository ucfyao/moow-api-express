const express = require('express');
const HomeController = require('../controllers/homeController');

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Home endpoint
 *     tags:
 *       - Home
 *     description: Returns a welcome message or basic API information.
 *     responses:
 *       200:
 *         description: Successfully retrieved home message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to the API!"
 */
router.get('/', HomeController.index);

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Test endpoint
 *     tags:
 *       - Home
 *     description: A test API endpoint to verify server functionality.
 *     responses:
 *       200:
 *         description: Test response successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 */
router.get('/test', HomeController.test);

/**
 * @swagger
 * /check-task:
 *   get:
 *     summary: Check scheduled tasks
 *     tags:
 *       - Home
 *     description: Checks the status of background tasks or scheduled jobs.
 *     responses:
 *       200:
 *         description: Task check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasksRunning:
 *                   type: boolean
 *                   example: true
 */
router.get('/check-task', HomeController.checkTask);

/**
 * @swagger
 * /api/v1/public/btc-history:
 *   get:
 *     summary: Get BTC price history
 *     tags:
 *       - Home
 *     description: Returns BTC/USDT daily price history for the homepage chart. No authentication required.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 365
 *         description: Maximum number of data points to return
 *     responses:
 *       200:
 *         description: Successfully returned BTC price history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             example: "2025-01-15"
 *                           open:
 *                             type: number
 *                           high:
 *                             type: number
 *                           low:
 *                             type: number
 *                           close:
 *                             type: number
 *                           volume:
 *                             type: number
 */
const clampBtcHistoryLimit = (req, res, next) => {
  const limit = parseInt(req.query.limit, 10);
  req.query.limit = !limit || limit < 1 ? 365 : Math.min(limit, 365);
  next();
};

router.get('/api/v1/public/btc-history', clampBtcHistoryLimit, HomeController.getBtcHistory);

/**
 * @swagger
 * /api/v1/public/dingtou/orders:
 *   get:
 *     summary: Get public DCA demo orders
 *     tags:
 *       - Home
 *     description: Returns the order history for the showcase DCA strategy. No authentication required.
 *     responses:
 *       200:
 *         description: Successfully returned DCA demo orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/api/v1/public/dingtou/orders', HomeController.getDingtouOrders);

module.exports = router;
