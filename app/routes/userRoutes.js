const express = require('express');
const UserController = require('../controllers/userController');
const validateParams = require('../middlewares/validateMiddleware');
const asyncHandler = require('../utils/asyncHandler');

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
router.get('/api/v1/users', asyncHandler(UserController.index));

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
router.get('/api/v1/users/:id', asyncHandler(UserController.show));

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
  validateParams(updateUserValidatorSchema),
  asyncHandler(UserController.patch),
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (not enabled yet)
 *     tags:
 *       - Users Management
 *     description: Delete a user by ID (not enabled in the current interface).
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Unique ID of the user
 *     responses:
 *       501:
 *         description: This interface is not enabled yet
 */
// router.delete('/users/:id', UserController.deleteUser);

module.exports = router;
