// routes/usermarketRoutes.js
const express = require('express');
const UserMarketController = require('../controllers/userMarketController');
const validateParams = require('../middlewares/validateMiddleware');

const { createUserMarketValidatorSchema } = require('../validators/userMarketValidator');

const router = express.Router();

router.get('/usermarkets', UserMarketController.getAllUserMarkets);
router.post('/usermarkets', validateParams(createUserMarketValidatorSchema), UserMarketController.createUserMarket);
router.get('/usermarkets/:id', UserMarketController.getUserMarketById);
// router.put('/usermarkets/:id', UserMarketController.updateUserMarket);
// router.delete('/usermarkets/:id', UserMarketController.deleteUserMarket);

module.exports = router;