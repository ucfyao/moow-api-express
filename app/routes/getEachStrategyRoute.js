const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');

const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

const router = express.Router();

// RESTful API routes for investment strategies
router.get('/strategies', strategyController.getAllStrategies);
router.get('/strategies/:id', strategyController.getStrategyById);     

module.exports = router;

