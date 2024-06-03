// routes/keyRoutes.js
const express = require('express');
const KeyController = require('../controllers/keyController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createKeyValidatorSchema } = require('../validators/keyValidator');

const router = express.Router();

router.get('/keys', asyncHandler(KeyController.getAllKeys));
router.post('/keys', validateParams(createKeyValidatorSchema), asyncHandler(KeyController.createKey));
router.get('/keys/:id', asyncHandler(KeyController.getKeyById));


module.exports = router;