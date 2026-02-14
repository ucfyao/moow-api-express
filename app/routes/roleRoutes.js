const express = require('express');
const RoleController = require('../controllers/roleController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const {
  createRoleValidatorSchema,
  updateRoleValidatorSchema,
} = require('../validators/roleValidator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: List all roles
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by role name
 *     responses:
 *       200:
 *         description: Role list
 */
router.get('/api/v1/roles', authMiddleware, RoleController.index);

/**
 * @swagger
 * /api/v1/roles/droplist:
 *   get:
 *     summary: Get roles for dropdown selection
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Role dropdown list
 */
router.get('/api/v1/roles/droplist', authMiddleware, RoleController.droplist);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details
 */
router.get('/api/v1/roles/:id', authMiddleware, RoleController.show);

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_name]
 *             properties:
 *               role_name:
 *                 type: string
 *               role_description:
 *                 type: string
 *               resource:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Role created
 */
router.post(
  '/api/v1/roles',
  authMiddleware,
  validateParams(createRoleValidatorSchema),
  RoleController.create,
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   patch:
 *     summary: Update a role
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch(
  '/api/v1/roles/:id',
  authMiddleware,
  validateParams(updateRoleValidatorSchema),
  RoleController.update,
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [RBAC - Role Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete('/api/v1/roles/:id', authMiddleware, RoleController.destroy);

module.exports = router;
