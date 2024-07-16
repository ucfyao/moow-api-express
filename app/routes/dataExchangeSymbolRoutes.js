const express = require('express');
const DataExchangeSymbolController = require('../controllers/dataExchangeSymbolController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { dataExchangeSymbolValidatorSchema } = require('../validators/dataExchangeSymbolValidator');

const router = express.Router();

// TODO complete symbol routers
// For test

// get a data exchange symbol
router.get('/api/v1/dataExchangeSymbol', asyncHandler(DataExchangeSymbolController.show));

// Create a new data exchange symbol
router.post(
  '/api/v1/dataExchangeSymbol',
  validateParams(dataExchangeSymbolValidatorSchema),
  asyncHandler(DataExchangeSymbolController.create),
);

module.exports = router;