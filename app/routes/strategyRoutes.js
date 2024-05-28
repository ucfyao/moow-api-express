const express = require('express');
const strategyController = require('../controllers/strategyController');
const validateParams = require('../middlewares/validateMiddleware');
const strategyValidatorSchema = require('../validators/strategyValidator');

// const {creategetEachStrategySchema} = require('../validators/getEachStrategyValidator')

// or use router, write all routes in one file
const router = express.Router();

// RESTful API routes for investment strategies
// view all strategies
router.get('/strategies', strategyController.getAllStrategies);

// new a strategy
router.post('/strategies', 
    validateParams(strategyValidatorSchema),
    strategyController.createStrategy);

// view a strategy
router.get('/strategies/:id', strategyController.getStrategyById);    

// update a strategy 
// router.patch('/strategies/:id',  
//     validateParams(updateStrategyValidatorSchema),
//     strategyController.updateStrategy); 


module.exports = router;

