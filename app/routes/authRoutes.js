const express = require('express');
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

/**
 * @swagger
 * /api/v1/captcha:
 *   get:
 *     summary: Get captcha
 *     tags:
 *       - Authentication
 *     description: Retrieve a captcha for verification.
 *     responses:
 *       200:
 *         description: Captcha retrieved successfully
 */
router.get('/api/v1/captcha', AuthController.getCaptcha);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Authentication
 *     description: Login a user with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'user@example.com'
 *               password:
 *                 type: string
 *                 example: 'password123'
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post('/api/v1/auth/login', validateParams(signinValidatorSchema), AuthController.signin);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   delete:
 *     summary: User logout
 *     tags:
 *       - Authentication
 *     description: Logout the current user.
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.delete(
  '/api/v1/auth/logout',
  validateParams(signoutValidatorSchema),
  authMiddleware,
  AuthController.signout
);

/**
 * @swagger
 * /api/v1/auth/passwordReset:
 *   patch:
 *     summary: Reset password
 *     tags:
 *       - Authentication
 *     description: Reset the user's password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'user@example.com'
 *               newPassword:
 *                 type: string
 *                 example: 'newpassword123'
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.patch('/api/v1/auth/passwordReset', AuthController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/activation:
 *   post:
 *     summary: Activate account
 *     tags:
 *       - Authentication
 *     description: Send activation email to the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'user@example.com'
 *     responses:
 *       200:
 *         description: Activation email sent successfully
 */
router.post(
  '/api/v1/auth/activation',
  validateParams(sendActivateEmailValidatorSchema),
  AuthController.sendActivateEmail
);
/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: User signup
 *     tags:
 *       - Authentication
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
  AuthController.signUp
);

/**
 * @swagger
 * /api/v1/auth/verification:
 *   patch:
 *     summary: Account verification
 *     tags:
 *       - Authentication
 *     description: Verify the user's account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'user@example.com'
 *               verificationCode:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: Account verified successfully
 */
router.patch('/api/v1/auth/verification', AuthController.activateUser);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     tags:
 *       - Authentication
 *     description: Refresh the current session token. Requires valid auth headers.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired token
 */
router.post('/api/v1/auth/refresh', authMiddleware, AuthController.refresh);

/**
 * @swagger
 * /api/v1/auth/passwordRecovery:
 *   post:
 *     summary: Password recovery
 *     tags:
 *       - Authentication
 *     description: Send password recovery email to the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: 'user@example.com'
 *     responses:
 *       200:
 *         description: Password recovery email sent successfully
 */
router.post(
  '/api/v1/auth/passwordRecovery',
  validateParams(retrievePasswordValidatorSchema),
  AuthController.sendRetrieveEmail
);

module.exports = router;
