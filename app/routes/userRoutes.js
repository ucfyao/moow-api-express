const express = require('express');
const UserController = require('../controllers/userController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const { updateUserValidatorSchema } = require('../validators/userValidator');

const router = express.Router();

router.get('/api/v1/users', asyncHandler(UserController.index));
router.get('/api/v1/users/:id', asyncHandler(UserController.show));
router.patch(
  '/api/v1/users/:id',
  validateParams(updateUserValidatorSchema),
  asyncHandler(UserController.patch),
);
// router.delete('/users/:id', UserController.deleteUser);

module.exports = router;
