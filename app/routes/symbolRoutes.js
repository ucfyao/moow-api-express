const express = require('express');
const SymbolController = require('../controllers/symbolController');
const asyncHandler = require('../utils/asyncHandler');
const validateParams = require('../middlewares/validateMiddleware');
const { dateValidatorSchema, loaderValidatorSchema } = require('../validators/symbolValidator');

const router = express.Router();

// get a list of all data exchange symbol
router.get('/api/v1/symbols', asyncHandler(SymbolController.index));

// view a symbol by id
router.get('/api/v1/symbols/:id', asyncHandler(SymbolController.show));

// For test, so there's no validator
// Create a new data exchange symbol
router.post('/api/v1/symbols', asyncHandler(SymbolController.create));

router.post(
  '/api/v1/symbols/getPrice',   
  validateParams(dateValidatorSchema),
  asyncHandler(SymbolController.getPrice));

router.post(
  '/api/v1/symbols/priceLoader', 
  validateParams(loaderValidatorSchema),
  asyncHandler(SymbolController.loadPrice))
module.exports = router;