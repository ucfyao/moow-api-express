// routes/ExchangeKeyRoutes.js
const express = require('express');
const ExchangeKeyController = require('../controllers/exchangeKeyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createKeyValidatorSchema } = require('../validators/exchangeKeyValidator');

const router = express.Router();

router.get('/api/v1/keys', asyncHandler(ExchangeKeyController.getAllKeys));
router.post(
  '/api/v1/keys',
  validateParams(createKeyValidatorSchema),
  asyncHandler(ExchangeKeyController.createKey),
);
router.get('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.getKeyById));
router.delete('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.deleteKey));

module.exports = router;
