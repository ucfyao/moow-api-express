const express = require('express');
const SymbolController = require('../controllers/symbolController');
const asyncHandler = require('../utils/asyncHandler');
const validateParams = require('../middlewares/validateMiddleware');
const { dateValidatorSchema, loaderValidatorSchema } = require('../validators/symbolValidator');

const router = express.Router();

// get a list of all data exchange symbol
router.get('/api/v1/symbols', asyncHandler(SymbolController.index));

// For test, so there's no validator
// Create a new data exchange symbol
router.post('/api/v1/symbols', asyncHandler(SymbolController.create));

router.post(
  '/api/v1/symbols/priceRetrieval',   
  validateParams(dateValidatorSchema),
  asyncHandler(SymbolController.retrievePrice));

router.post(
  '/api/v1/symbols/priceLoader', 
  validateParams(loaderValidatorSchema),
  asyncHandler(SymbolController.loadPrice))
module.exports = router;

router.get(
  '/api/v1/symbols/priceFetch', 
  validateParams(dateValidatorSchema),
  asyncHandler(SymbolController.fetchPrice)) 
module.exports = router;

// view a symbol by id
//sorry i have to change the position of getSymbolById, otherwise "priceFetch" will be interpreted as id param
router.get('/api/v1/symbols/:id', asyncHandler(SymbolController.show));