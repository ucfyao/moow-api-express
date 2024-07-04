const express = require('express');
const HomeController = require('../controllers/homeController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(HomeController.index));
router.get('/test', asyncHandler(HomeController.test));
router.get('/check-task', asyncHandler(HomeController.checkTask));

module.exports = router;
