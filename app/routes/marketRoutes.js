// routes/MarketRoutes.js
const express = require('express');
const MarketController = require('../controllers/marketController');
const validateParams = require('../middlewares/validateMiddleware');

const { createMarketValidatorSchema } = require('../validators/marketValidator');

const router = express.Router();

router.get('/markets', MarketController.getAllMarkets);
router.post('/markets', validateParams(createMarketValidatorSchema), MarketController.createMarket);
router.get('/markets/:id', MarketController.getMarketById);

// router.put('/usermarkets/:id', UserMarketController.updateUserMarket);
// router.delete('/usermarkets/:id', UserMarketController.deleteUserMarket);

module.exports = router;