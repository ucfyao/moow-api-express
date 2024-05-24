// routes/usermarketRoutes.js
const express = require('express');
const UsermarketController = require('../controllers/usermarketController');
const validateParams = require('../middlewares/validateMiddleware');

const { createUsermarketValidatorSchema } = require('../validators/userMarketValidator');

const router = express.Router();

router.get('/usermarkets', UsermarketController.getAllUsermarkets);
router.post('/usermarkets', validateParams(createUsermarketValidatorSchema), UsermarketController.createUsermarket);
router.get('/usermarkets/:id', UsermarketController.getUsermarketById);

router.post('/account-info', UsermarketController.getAccountInfo);
// router.put('/usermarkets/:id', UserMarketController.updateUserMarket);
// router.delete('/usermarkets/:id', UserMarketController.deleteUserMarket);

module.exports = router;