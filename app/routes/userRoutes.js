const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');

const { updateUserValidatorSchema } = require('../validators/userValidator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users Management
 *     description: Get all user information in the system.
 *     responses:
 *       200:
 *         description: Successfully returned the user list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "user123"
 *                   name:
 *                     type: string
 *                     example: "Alice"
 *                   email:
 *                     type: string
 *                     example: "alice@example.com"
 */
router.get('/api/v1/users', authMiddleware, UserController.index);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags:
 *       - Users Management
 *     description: Get the authenticated user's profile including referral code.
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: User profile with ref_code
 */
router.get('/api/v1/users/profile', authMiddleware, UserController.profile);

/**
 * @swagger
 * /api/v1/users/invitations:
 *   get:
 *     summary: Get list of invited users
 *     tags:
 *       - Users Management
 *     description: Get paginated list of users invited by the current user.
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated invitation list
 */
router.get('/api/v1/users/invitations', authMiddleware, UserController.inviteList);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get the specified user information
 *     tags:
 *       - Users Management
 *     description: Get detailed information of a user by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the user
 *     responses:
 *       200:
 *         description: Successfully returned user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "user123"
 *                 name:
 *                   type: string
 *                   example: "Alice"
 *                 email:
 *                   type: string
 *                   example: "alice@example.com"
 */
router.get('/api/v1/users/:id', authMiddleware, UserController.show);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update User Information
 *     tags:
 *       - Users Management
 *     description: Update user information (such as name, email address, etc.) based on user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               email:
 *                 type: string
 *                 example: "updated@example.com"
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the user
 *     responses:
 *       200:
 *         description: User information updated successfully
 */
router.patch(
  '/api/v1/users/:id',
  authMiddleware,
  validateParams(updateUserValidatorSchema),
  UserController.patch
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Soft delete user account
 *     tags:
 *       - Users Management
 *     description: Soft delete a user account (sets is_deleted flag). Users can only delete their own account.
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the user
 *     responses:
 *       200:
 *         description: User soft deleted successfully
 */
router.delete('/api/v1/users/:id', authMiddleware, UserController.destroy);

module.exports = router;
