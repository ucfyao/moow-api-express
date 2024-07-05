// routes/ExchangeKeyRoutes.js
const express = require('express');
const ExchangeKeyController = require('../controllers/exchangeKeyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createKeyValidatorSchema, updateKeyValidatorSchema } = require('../validators/exchangeKeyValidator');

const router = express.Router();

router.get('/api/v1/keys', asyncHandler(ExchangeKeyController.index));
router.post(
  '/api/v1/keys',
  validateParams(createKeyValidatorSchema),
  asyncHandler(ExchangeKeyController.create),
);
router.put(
  '/api/v1/keys',
  validateParams(updateKeyValidatorSchema),
  asyncHandler(ExchangeKeyController.update),
);
router.get('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.show));
router.delete('/api/v1/keys/:id', asyncHandler(ExchangeKeyController.destroy));

module.exports = router;
