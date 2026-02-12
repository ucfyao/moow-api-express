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

module.exports = router;
