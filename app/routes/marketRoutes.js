const express = require('express');
const MarketController = require('../controllers/marketController');
const validateParams = require('../middlewares/validateMiddleware');
const { createMarketValidatorSchema, updateMarketValidatorSchema } = require('../validators/marketValidator');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// get all markets list
router.get('/api/v1/markets', asyncHandler(MarketController.index));

// create a new markets
router.post(
  '/api/v1/markets',
  validateParams(createMarketValidatorSchema),
  asyncHandler(MarketController.create),
);

// get a market by ID
router.get('/api/v1/markets/:id', asyncHandler(MarketController.show));

// update market info updateMarket
router.put('/api/v1/markets/:id', asyncHandler(MarketController.update));

// delete a market
router.delete('/api/v1/markets/:id', asyncHandler(MarketController.destroy));

module.exports = router;
