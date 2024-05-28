// routes/keyRoutes.js
const express = require('express');
const KeyController = require('../controllers/keyController');
const validateParams = require('../middlewares/validateMiddleware');

const { createKeyValidatorSchema } = require('../validators/keyValidator');

const router = express.Router();

router.get('/keys', KeyController.getAllKeys);
router.post('/keys', validateParams(createKeyValidatorSchema), KeyController.createKey);
router.get('/keys/:id', KeyController.getKeyById);

// router.put('/keys/:id', KeyController.updateKey);
// router.delete('/keys/:id', KeyController.deleteKey);

module.exports = router;