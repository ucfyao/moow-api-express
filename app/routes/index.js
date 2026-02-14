const express = require('express');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: API endpoints related to user authentication
 *   - name: Exchange Key Management
 *     description: API endpoints for managing exchange API keys
 *   - name: Market Management
 *     description: API endpoints for market data retrieval
 *   - name: Orders Management
 *     description: API endpoints for order management
 *   - name: Trading strategy management
 *     description: API endpoints for managing trading strategies
 *   - name: Trading strategy execution
 *     description: API endpoints for managing trading execution
 *   - name: Symbols Management
 *     description: API endpoints related to trading symbols
 *   - name: Symbols price query
 *     description: API endpoints related to symbols price query
 *   - name: Users Management
 *     description: API endpoints related to user information
 *   - name: Arbitrage
 *     description: API endpoints for arbitrage opportunity detection and configuration
 *   - name: Home
 *     description: API endpoints for general system checks and status
 *
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API Entry Point
 *     tags:
 *       - Home
 *     description: Entry point for the API, dynamically loads all routes from the `routes` directory.
 *     responses:
 *       200:
 *         description: API is working correctly
 */

const registerRoutes = (router, routesPath) => {
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const route = require(path.join(routesPath, file));
      router.use('/', route);
    }
  });
};

const router = express.Router();
registerRoutes(router, __dirname);

module.exports = router;
