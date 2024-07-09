const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validateParams = require('../middlewares/validateMiddleware');
const {
  signinValidatorSchema,
  signoutValidatorSchema,
  sendActivateEmailValidatorSchema,
  createUserValidatorSchema,
  retrievePasswordValidatorSchema,
} = require('../validators/authValidator');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthController = require('../controllers/authController');

const router = express.Router();


router.get('/api/v1/captcha', asyncHandler(AuthController.getCaptcha));
router.post(
  '/api/v1/auth/login',
  validateParams(signinValidatorSchema),
  asyncHandler(AuthController.signin),
);
router.delete(
  '/api/v1/auth/logout',
  validateParams(signoutValidatorSchema),
  authMiddleware,
  asyncHandler(AuthController.signout),
);
router.patch('/api/v1/auth/passwordReset', asyncHandler(AuthController.resetPassword));
router.post(
  '/api/v1/auth/activation',
  validateParams(sendActivateEmailValidatorSchema),
  asyncHandler(AuthController.sendActivateEmail),
);
/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: User signup
 *     description: Register a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: 'user1'
 *               email:
 *                 type: string
 *                 example: 'kelseywong@gmail.com'
 *               password:
 *                 type: string
 *                 example: 'password123'
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
  '/api/v1/auth/signup',
  validateParams(createUserValidatorSchema),
  asyncHandler(AuthController.signUp),
);
router.patch('/api/v1/auth/verification', asyncHandler(AuthController.activateUser));
router.post(
  '/api/v1/auth/passwordRecovery',
  validateParams(retrievePasswordValidatorSchema),
  asyncHandler(AuthController.sendRetrieveEmail),
);

module.exports = router;
