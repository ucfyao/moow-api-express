const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validateParams = require('../middlewares/validateMiddleware');
const { signinValidatorSchema, exitValidatorSchema, sendActivateEmailValidatorSchema } = require('../validators/authValidator');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthController = require('../controllers/authController');

const router = express.Router();

router.get('/api/v1/captcha', asyncHandler(AuthController.getCaptcha));
router.post('/api/v1/auth/login', validateParams(signinValidatorSchema), asyncHandler(AuthController.signin));
router.delete('/api/v1/auth/logout', validateParams(exitValidatorSchema), authMiddleware, asyncHandler(AuthController.exit));
router.patch('/api/v1/auth/login', asyncHandler(AuthController.resetPassword));
router.post('/api/v1/auth/activation', validateParams(sendActivateEmailValidatorSchema), asyncHandler(AuthController.sendActivateEmail));
router.patch('/api/v1/auth/verification', asyncHandler(AuthController.activateUser));

module.exports = router;
