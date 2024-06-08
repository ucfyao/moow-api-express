// routes/ExchangeKeyRoutes.js
const express = require('express');
const AipExchangeKeyController = require('../controllers/ExchangeKeyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createKeyValidatorSchema } = require('../validators/exchangeKeyValidator');

const router = express.Router();

router.get('/api/v1/keys', asyncHandler(AipExchangeKeyController.getAllKeys));
router.post('/api/v1/keys', validateParams(createKeyValidatorSchema), asyncHandler(AipExchangeKeyController.createKey));
router.get('/api/v1/keys/:id', asyncHandler(AipExchangeKeyController.getKeyById));
router.delete('/api/v1/keys/:id', asyncHandler(AipExchangeKeyController.deleteKey));

module.exports = router;