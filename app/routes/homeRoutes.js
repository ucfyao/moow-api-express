const express = require('express');
const HomeController = require('../controllers/homeController');

const router = express.Router();

router.get('/check-task', HomeController.checkTask);

module.exports = router;