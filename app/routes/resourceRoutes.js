const express = require('express');
const ResourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const {
  createResourceValidatorSchema,
  updateResourceValidatorSchema,
} = require('../validators/resourceValidator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/resources:
 *   get:
 *     summary: List all resources
 *     tags: [RBAC - Resource Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search by resource name
 *     responses:
 *       200:
 *         description: Resource list
 */
router.get('/api/v1/resources', authMiddleware, ResourceController.index);

/**
 * @swagger
 * /api/v1/resources/tree:
 *   get:
 *     summary: Get resources as hierarchical tree
 *     tags: [RBAC - Resource Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource tree
 */
router.get('/api/v1/resources/tree', authMiddleware, ResourceController.tree);

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [RBAC - Resource Management]
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
 *         description: Resource details
 */
router.get('/api/v1/resources/:id', authMiddleware, ResourceController.show);

/**
 * @swagger
 * /api/v1/resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [RBAC - Resource Management]
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resource_code, resource_name, resource_type]
 *             properties:
 *               resource_code:
 *                 type: string
 *               resource_name:
 *                 type: string
 *               resource_type:
 *                 type: string
 *                 enum: [group, menu, interface]
 *               resource_pid:
 *                 type: string
 *               resource_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created
 */
router.post(
  '/api/v1/resources',
  authMiddleware,
  validateParams(createResourceValidatorSchema),
  ResourceController.create,
);

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   patch:
 *     summary: Update a resource
 *     tags: [RBAC - Resource Management]
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
 *         description: Resource updated
 */
router.patch(
  '/api/v1/resources/:id',
  authMiddleware,
  validateParams(updateResourceValidatorSchema),
  ResourceController.update,
);

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [RBAC - Resource Management]
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
 *         description: Resource deleted
 */
router.delete('/api/v1/resources/:id', authMiddleware, ResourceController.destroy);

module.exports = router;
