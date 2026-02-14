const express = require('express');
const RateController = require('../controllers/rateController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/rates:
 *   get:
 *     summary: Get exchange rate list (RMB-based)
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: Exchange rate list (virtual coins first, then legal tender)
 */
router.get('/api/v1/rates', RateController.rmbRateList);

module.exports = router;
