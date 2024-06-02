const express = require('express');
const UserController = require('../controllers/userController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const { createUserValidatorSchema } = require('../validators/userValidator');
const { updateUserValidatorSchema } = require('../validators/userValidator');

const router = express.Router();

router.get('/api/v1/users', asyncHandler(UserController.getAllUsers));
router.post('/api/v1/users', validateParams(createUserValidatorSchema), asyncHandler(UserController.createUser));
router.get('/api/v1/users/:id', asyncHandler(UserController.getUserById));
router.patch('/api/v1/users/:id', validateParams(updateUserValidatorSchema), asyncHandler(UserController.updateUser));
// router.delete('/users/:id', UserController.deleteUser);

module.exports = router;