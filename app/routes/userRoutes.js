const express = require('express');
const UserController = require('../controllers/userController');
const validateParams = require('../middlewares/validateMiddleware');

const { createUserValidatorSchema } = require('../validators/userValidator');

const router = express.Router();

router.get('/users', UserController.getAllUsers);
router.post('/users', validateParams(createUserValidatorSchema), UserController.createUser);
router.get('/users/:id', UserController.getUserById);
// router.put('/users/:id', UserController.updateUser);
// router.delete('/users/:id', UserController.deleteUser);

module.exports = router;