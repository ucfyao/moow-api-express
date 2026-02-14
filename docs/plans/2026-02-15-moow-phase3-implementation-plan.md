# Moow Phase 3 — Multi-Module Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate 6 remaining modules from Egg.js to Express: RBAC, Purchase, Rate, WeChat, Assets, and frontend stub pages.

**Architecture:** 4 parallel tracks across 4 terminal windows. Tracks A/B/C target moow-api-express (backend), Track D targets moow-web-next (frontend). All tracks create new files only — no shared file conflicts. Routes are auto-discovered, so no index.js changes needed.

**Tech Stack:** Express 5, Mongoose 8, Jest 30, CCXT 4, node-cron, Next.js 15, React 19, Bulma, Emotion CSS, react-i18next

**Parallelism:** All 4 tracks are fully independent and can run simultaneously.

**Repos:**
- Backend: `/path/to/moow-api-express`
- Frontend: `/path/to/moow-web-next`

---

## Track A: RBAC Module (Role + Resource)

**Scope:** 12 REST endpoints, 2 models, 2 services, 2 controllers, 2 route files, 2 validators, tests
**Complexity:** High
**Estimated time:** 15-20 min

### Task A1: Create Role and Resource Models

**Files:**
- Create: `app/models/portalRoleModel.js`
- Create: `app/models/portalResourceModel.js`

**portalRoleModel.js:**

```javascript
const mongoose = require('mongoose');

const PortalRoleSchema = new mongoose.Schema(
  {
    role_name: { type: String, required: true, trim: true },
    role_description: { type: String, trim: true },
    resource: [{ type: mongoose.Schema.Types.ObjectId, ref: 'portal_resource' }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portal_roles',
  },
);

module.exports = mongoose.model('portal_role', PortalRoleSchema);
```

**portalResourceModel.js:**

```javascript
const mongoose = require('mongoose');

const PortalResourceSchema = new mongoose.Schema(
  {
    resource_pid: { type: mongoose.Schema.Types.ObjectId, default: null },
    resource_code: { type: String, required: true, trim: true },
    resource_type: { type: String, enum: ['group', 'menu', 'interface'], required: true },
    resource_name: { type: String, required: true, trim: true },
    resource_url: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portal_resources',
  },
);

module.exports = mongoose.model('portal_resource', PortalResourceSchema);
```

---

### Task A2: Create Role Service

**Files:**
- Create: `app/services/roleService.js`

```javascript
const PortalRoleModel = require('../models/portalRoleModel');
const PortalUserModel = require('../models/portalUserModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const logger = require('../utils/logger');

class RoleService {
  async getAllRoles(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.role_name = { $regex: params.keyword, $options: 'i' };
    }
    const list = await PortalRoleModel.find(conditions)
      .select('role_name role_description resource')
      .sort({ created_at: -1 })
      .lean();
    return { list, total: list.length };
  }

  async getRoleDroplist() {
    const roles = await PortalRoleModel.find().select('role_name').lean();
    const list = roles.map((r) => ({ value: r._id, label: r.role_name }));
    return { list };
  }

  async getRoleById(id) {
    const role = await PortalRoleModel.findById(id).lean();
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    return role;
  }

  async createRole(data) {
    const role = new PortalRoleModel(data);
    await role.save();
    return { _id: role._id };
  }

  async updateRole(id, data) {
    const role = await PortalRoleModel.findById(id);
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    if (data.role_name !== undefined) role.role_name = data.role_name;
    if (data.role_description !== undefined) role.role_description = data.role_description;
    if (data.resource !== undefined) role.resource = data.resource;
    await role.save();
    return { _id: role._id };
  }

  async deleteRole(id) {
    const role = await PortalRoleModel.findById(id);
    if (!role) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Role not found');
    }
    // Check if role is assigned to any user
    const userCount = await PortalUserModel.countDocuments({ role: id });
    if (userCount > 0) {
      throw new CustomError(STATUS_TYPE.HTTP_CONFLICT, 409, 'Role is in use and cannot be deleted');
    }
    await PortalRoleModel.findByIdAndDelete(id);
    return { _id: id };
  }
}

module.exports = new RoleService();
```

---

### Task A3: Create Resource Service

**Files:**
- Create: `app/services/resourceService.js`

```javascript
const PortalResourceModel = require('../models/portalResourceModel');
const PortalRoleModel = require('../models/portalRoleModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');

class ResourceService {
  async getAllResources(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.resource_name = { $regex: params.keyword, $options: 'i' };
    }
    const list = await PortalResourceModel.find(conditions).sort({ created_at: -1 }).lean();
    return { list, total: list.length };
  }

  async getResourceTree(params = {}) {
    const conditions = {};
    if (params.keyword) {
      conditions.resource_name = { $regex: params.keyword, $options: 'i' };
    }
    const resources = await PortalResourceModel.find(conditions).lean();
    const tree = this._buildTree(resources);
    return { tree };
  }

  async getResourceById(id) {
    const resource = await PortalResourceModel.findById(id).lean();
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    return resource;
  }

  async createResource(data) {
    const resource = new PortalResourceModel(data);
    await resource.save();
    return { _id: resource._id };
  }

  async updateResource(id, data) {
    const resource = await PortalResourceModel.findById(id);
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    const fields = ['resource_pid', 'resource_code', 'resource_type', 'resource_name', 'resource_url'];
    fields.forEach((f) => {
      if (data[f] !== undefined) resource[f] = data[f];
    });
    await resource.save();
    return { _id: resource._id };
  }

  async deleteResource(id) {
    const resource = await PortalResourceModel.findById(id);
    if (!resource) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Resource not found');
    }
    // Check if resource is assigned to any role
    const roleCount = await PortalRoleModel.countDocuments({ resource: id });
    if (roleCount > 0) {
      throw new CustomError(STATUS_TYPE.HTTP_CONFLICT, 409, 'Resource is in use and cannot be deleted');
    }
    await PortalResourceModel.findByIdAndDelete(id);
    return { _id: id };
  }

  _buildTree(resources) {
    const map = {};
    const roots = [];
    resources.forEach((r) => {
      map[r._id.toString()] = { ...r, children: [] };
    });
    resources.forEach((r) => {
      if (r.resource_pid) {
        const parent = map[r.resource_pid.toString()];
        if (parent) {
          parent.children.push(map[r._id.toString()]);
        } else {
          roots.push(map[r._id.toString()]);
        }
      } else {
        roots.push(map[r._id.toString()]);
      }
    });
    return roots;
  }
}

module.exports = new ResourceService();
```

---

### Task A4: Create Role and Resource Validators

**Files:**
- Create: `app/validators/roleValidator.js`
- Create: `app/validators/resourceValidator.js`

**roleValidator.js:**

```javascript
const createRoleValidatorSchema = {
  role_name: {
    notEmpty: { errorMessage: 'role_name is required' },
    isString: { errorMessage: 'role_name must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'role_name must be 2-100 characters' },
  },
};

const updateRoleValidatorSchema = {
  role_name: {
    optional: true,
    isString: { errorMessage: 'role_name must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'role_name must be 2-100 characters' },
  },
  resource: {
    optional: true,
    isArray: { errorMessage: 'resource must be an array' },
  },
};

module.exports = { createRoleValidatorSchema, updateRoleValidatorSchema };
```

**resourceValidator.js:**

```javascript
const createResourceValidatorSchema = {
  resource_code: {
    notEmpty: { errorMessage: 'resource_code is required' },
    isString: { errorMessage: 'resource_code must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'resource_code must be 2-100 characters' },
  },
  resource_name: {
    notEmpty: { errorMessage: 'resource_name is required' },
    isString: { errorMessage: 'resource_name must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'resource_name must be 2-100 characters' },
  },
  resource_type: {
    notEmpty: { errorMessage: 'resource_type is required' },
    isIn: { options: [['group', 'menu', 'interface']], errorMessage: 'resource_type must be group, menu, or interface' },
  },
};

const updateResourceValidatorSchema = {
  resource_code: {
    optional: true,
    isString: { errorMessage: 'resource_code must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'resource_code must be 2-100 characters' },
  },
  resource_name: {
    optional: true,
    isString: { errorMessage: 'resource_name must be a string' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'resource_name must be 2-100 characters' },
  },
  resource_type: {
    optional: true,
    isIn: { options: [['group', 'menu', 'interface']], errorMessage: 'resource_type must be group, menu, or interface' },
  },
};

module.exports = { createResourceValidatorSchema, updateResourceValidatorSchema };
```

---

### Task A5: Create Role and Resource Controllers

**Files:**
- Create: `app/controllers/roleController.js`
- Create: `app/controllers/resourceController.js`

**roleController.js:**

```javascript
const RoleService = require('../services/roleService');
const ResponseHandler = require('../utils/responseHandler');

class RoleController {
  async index(req, res) {
    const data = await RoleService.getAllRoles(req.query);
    return ResponseHandler.success(res, data);
  }

  async droplist(req, res) {
    const data = await RoleService.getRoleDroplist();
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await RoleService.getRoleById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async create(req, res) {
    const data = await RoleService.createRole(req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async update(req, res) {
    const data = await RoleService.updateRole(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async destroy(req, res) {
    const data = await RoleService.deleteRole(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new RoleController();
```

**resourceController.js:**

```javascript
const ResourceService = require('../services/resourceService');
const ResponseHandler = require('../utils/responseHandler');

class ResourceController {
  async index(req, res) {
    const data = await ResourceService.getAllResources(req.query);
    return ResponseHandler.success(res, data);
  }

  async tree(req, res) {
    const data = await ResourceService.getResourceTree(req.query);
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await ResourceService.getResourceById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async create(req, res) {
    const data = await ResourceService.createResource(req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async update(req, res) {
    const data = await ResourceService.updateResource(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async destroy(req, res) {
    const data = await ResourceService.deleteResource(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new ResourceController();
```

---

### Task A6: Create Role and Resource Routes

**Files:**
- Create: `app/routes/roleRoutes.js`
- Create: `app/routes/resourceRoutes.js`

**roleRoutes.js:**

```javascript
const express = require('express');
const RoleController = require('../controllers/roleController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const { createRoleValidatorSchema, updateRoleValidatorSchema } = require('../validators/roleValidator');

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
```

**resourceRoutes.js:**

```javascript
const express = require('express');
const ResourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const { createResourceValidatorSchema, updateResourceValidatorSchema } = require('../validators/resourceValidator');

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
```

**Important:** Route ordering — `/api/v1/roles/droplist` and `/api/v1/resources/tree` MUST be defined BEFORE `/:id` routes.

---

### Task A7: RBAC Unit Tests

**Files:**
- Create: `tests/unit/services/roleService.test.js`
- Create: `tests/unit/services/resourceService.test.js`

**roleService.test.js — test cases to cover:**

1. `getAllRoles()` — returns list with keyword filter
2. `getAllRoles()` — returns all roles when no keyword
3. `getRoleDroplist()` — returns formatted dropdown list
4. `getRoleById()` — returns role; throws if not found
5. `createRole()` — creates and returns `{ _id }`
6. `updateRole()` — updates fields; throws if not found
7. `deleteRole()` — deletes role; throws if not found; throws if role in use

**resourceService.test.js — test cases to cover:**

1. `getAllResources()` — returns list with keyword filter
2. `getResourceTree()` — builds hierarchical tree from flat list
3. `getResourceById()` — returns resource; throws if not found
4. `createResource()` — creates and returns `{ _id }`
5. `updateResource()` — updates fields; throws if not found
6. `deleteResource()` — deletes; throws if not found; throws if in use
7. `_buildTree()` — correctly nests children under parents

**Mock pattern:** Follow existing test structure — mock Mongoose models (`find`, `findById`, `findByIdAndDelete`, `countDocuments`, `save`).

---

## Track B: Purchase + Assets Module

**Scope:** 5 REST endpoints, 2 models, 2 services, 1 controller, 1 route file, 1 validator, tests
**Complexity:** Medium
**Estimated time:** 10-15 min

### Task B1: Create Purchase and Assets Models

**Files:**
- Create: `app/models/purchaseModel.js`
- Create: `app/models/assetsUserOrderModel.js`

**purchaseModel.js:**

```javascript
const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'PortalUser' },
    eth_address: { type: String, trim: true },
    tx_hash: { type: String, trim: true },
    amount: { type: String, trim: true },
    status: {
      type: String,
      enum: ['waiting', 'fail', 'success', 'invalid'],
      default: 'waiting',
    },
    comment: { type: String, trim: true },
    email: { type: String, trim: true },
    ref: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'purchases',
  },
);

PurchaseSchema.statics.STATUS_WAITING = 'waiting';
PurchaseSchema.statics.STATUS_FAIL = 'fail';
PurchaseSchema.statics.STATUS_SUCCESS = 'success';
PurchaseSchema.statics.STATUS_INVALID = 'invalid';

module.exports = mongoose.model('Purchase', PurchaseSchema);
```

**assetsUserOrderModel.js:**

```javascript
const mongoose = require('mongoose');

const AssetsUserOrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    amount: { type: String, trim: true },
    token: { type: String, trim: true },
    from_balance: { type: String, trim: true },
    to_balance: { type: String, trim: true },
    status: { type: String, enum: ['success', 'error'], trim: true },
    describe: { type: String, trim: true },
    invitee: { type: String, trim: true },
    invitee_email: { type: String, trim: true },
    status_describe: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'assets_user_orders',
  },
);

module.exports = mongoose.model('AssetsUserOrder', AssetsUserOrderSchema);
```

---

### Task B2: Create Assets Service

**Files:**
- Create: `app/services/assetsService.js`

**Purpose:** Internal service (no routes) — handles token transfers between users. Called by authService during signup and activation.

```javascript
const { v1: uuidv1 } = require('uuid');
const AssetsUserOrderModel = require('../models/assetsUserOrderModel');
const PortalUserModel = require('../models/portalUserModel');
const logger = require('../utils/logger');

class AssetsService {
  /**
   * Send tokens from one user to another
   * @param {Object} params - { from, email, amount, token, describe, invitee, invitee_email }
   * @returns {Object|false} Updated recipient user or false if failed
   */
  async sendToken(params) {
    const { from, email, amount, token, describe, invitee, invitee_email } = params;

    const sender = await PortalUserModel.findById(from);
    const recipient = await PortalUserModel.findOne({ email });

    // Validate both users exist
    if (!sender || !recipient) {
      await this._createOrder({
        from, to: recipient ? recipient._id : '',
        amount, token, describe, invitee, invitee_email,
        from_balance: sender ? sender.XBT : '0',
        to_balance: recipient ? recipient.XBT : '0',
        status: 'error',
        status_describe: !sender ? 'Sender not found' : 'Recipient not found',
      });
      return false;
    }

    // Validate sender balance
    const senderBalance = parseFloat(sender.XBT || '0');
    const transferAmount = parseFloat(amount || '0');
    if (senderBalance < transferAmount) {
      await this._createOrder({
        from: sender._id, to: recipient._id,
        amount, token, describe, invitee, invitee_email,
        from_balance: sender.XBT, to_balance: recipient.XBT,
        status: 'error',
        status_describe: 'Insufficient balance',
      });
      return false;
    }

    // Execute transfer
    const newSenderBalance = senderBalance - transferAmount;
    const newRecipientBalance = parseFloat(recipient.XBT || '0') + transferAmount;

    sender.XBT = String(newSenderBalance);
    recipient.XBT = String(newRecipientBalance);
    await sender.save();
    await recipient.save();

    await this._createOrder({
      from: sender._id, to: recipient._id,
      amount, token, describe, invitee, invitee_email,
      from_balance: sender.XBT, to_balance: recipient.XBT,
      status: 'success',
      status_describe: 'Transfer completed',
    });

    logger.info(`[sendToken] ${amount} ${token} from ${sender.email} to ${recipient.email}`);
    return recipient;
  }

  async _createOrder(data) {
    const order = new AssetsUserOrderModel({
      order_id: uuidv1(),
      ...data,
    });
    await order.save();
    return order;
  }
}

module.exports = new AssetsService();
```

---

### Task B3: Create Purchase Service

**Files:**
- Create: `app/services/purchaseService.js`

```javascript
const PurchaseModel = require('../models/purchaseModel');
const PortalUserModel = require('../models/portalUserModel');
const CustomError = require('../utils/customError');
const { STATUS_TYPE } = require('../utils/statusCodes');
const logger = require('../utils/logger');

class PurchaseService {
  async submit(userId, data) {
    const user = await PortalUserModel.findById(userId).select('email ref').lean();
    const purchase = new PurchaseModel({
      user: userId,
      eth_address: data.eth_address,
      tx_hash: data.tx_hash,
      amount: data.amount,
      email: user ? user.email : '',
      ref: user ? user.ref : '',
    });
    await purchase.save();
    return { _id: purchase._id };
  }

  async getAllPurchases(params = {}) {
    const pageNumber = params.pageNumber || 1;
    const pageSize = params.pageSize || 20;
    const conditions = {};
    if (params.keyword) {
      conditions.$or = [
        { eth_address: { $regex: params.keyword, $options: 'i' } },
        { tx_hash: { $regex: params.keyword, $options: 'i' } },
        { email: { $regex: params.keyword, $options: 'i' } },
      ];
    }
    const total = await PurchaseModel.countDocuments(conditions);
    const list = await PurchaseModel.find(conditions)
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
    return { list, pageNumber, pageSize, total };
  }

  async getPurchaseById(id) {
    const purchase = await PurchaseModel.findById(id)
      .select('user eth_address tx_hash amount status comment email')
      .lean();
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }
    return purchase;
  }

  async updatePurchase(id, data) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }
    if (data.status !== undefined) purchase.status = data.status;
    if (data.comment !== undefined) purchase.comment = data.comment;
    await purchase.save();
    return { _id: purchase._id };
  }

  async promotePurchase(id) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new CustomError(STATUS_TYPE.HTTP_NOT_FOUND, 404, 'Purchase not found');
    }

    const user = await PortalUserModel.findById(purchase.user);
    if (!user) {
      throw new CustomError(STATUS_TYPE.PORTAL_USER_NOT_FOUND);
    }

    // Calculate VIP duration: amount * 10 months, 20% bonus if >= 2 months
    let addMonths = parseFloat(purchase.amount) * 10;
    if (addMonths >= 2) {
      addMonths = Math.floor(addMonths * 1.2);
    }

    const baseDate = user.vip_time_out_at && user.vip_time_out_at > new Date()
      ? user.vip_time_out_at
      : new Date();
    user.vip_time_out_at = new Date(baseDate.getTime() + addMonths * 31 * 24 * 60 * 60 * 1000);

    purchase.status = PurchaseModel.STATUS_SUCCESS;
    await purchase.save();
    await user.save();

    logger.info(`[promote] Purchase ${id}: +${addMonths} months VIP for user ${user.email}`);
    return { _id: purchase._id, vip_time_out_at: user.vip_time_out_at };
  }
}

module.exports = new PurchaseService();
```

---

### Task B4: Create Purchase Controller, Validator, and Routes

**Files:**
- Create: `app/controllers/purchaseController.js`
- Create: `app/validators/purchaseValidator.js`
- Create: `app/routes/purchaseRoutes.js`

**purchaseController.js:**

```javascript
const PurchaseService = require('../services/purchaseService');
const ResponseHandler = require('../utils/responseHandler');

class PurchaseController {
  async submit(req, res) {
    const data = await PurchaseService.submit(req.userId, req.body);
    return ResponseHandler.success(res, data, 201);
  }

  async index(req, res) {
    const data = await PurchaseService.getAllPurchases(req.query);
    return ResponseHandler.success(res, data);
  }

  async show(req, res) {
    const data = await PurchaseService.getPurchaseById(req.params.id);
    return ResponseHandler.success(res, data);
  }

  async update(req, res) {
    const data = await PurchaseService.updatePurchase(req.params.id, req.body);
    return ResponseHandler.success(res, data);
  }

  async promote(req, res) {
    const data = await PurchaseService.promotePurchase(req.params.id);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new PurchaseController();
```

**purchaseValidator.js:**

```javascript
const submitPurchaseValidatorSchema = {
  eth_address: {
    notEmpty: { errorMessage: 'eth_address is required' },
    isString: { errorMessage: 'eth_address must be a string' },
  },
  tx_hash: {
    notEmpty: { errorMessage: 'tx_hash is required' },
    isString: { errorMessage: 'tx_hash must be a string' },
  },
  amount: {
    notEmpty: { errorMessage: 'amount is required' },
    isString: { errorMessage: 'amount must be a string' },
  },
};

module.exports = { submitPurchaseValidatorSchema };
```

**purchaseRoutes.js:**

```javascript
const express = require('express');
const PurchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateParams = require('../middlewares/validateMiddleware');
const { submitPurchaseValidatorSchema } = require('../validators/purchaseValidator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/purchases:
 *   post:
 *     summary: Submit a new purchase
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eth_address, tx_hash, amount]
 *             properties:
 *               eth_address:
 *                 type: string
 *               tx_hash:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       201:
 *         description: Purchase submitted
 */
router.post(
  '/api/v1/purchases',
  authMiddleware,
  validateParams(submitPurchaseValidatorSchema),
  PurchaseController.submit,
);

/**
 * @swagger
 * /api/v1/purchases:
 *   get:
 *     summary: List all purchases (admin)
 *     tags: [Purchase Management]
 *     security:
 *       - tokenAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
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
 *         description: Purchase list
 */
router.get('/api/v1/purchases', authMiddleware, PurchaseController.index);

/**
 * @swagger
 * /api/v1/purchases/{id}:
 *   get:
 *     summary: Get purchase details
 *     tags: [Purchase Management]
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
 *         description: Purchase details
 */
router.get('/api/v1/purchases/:id', authMiddleware, PurchaseController.show);

/**
 * @swagger
 * /api/v1/purchases/{id}:
 *   patch:
 *     summary: Update purchase status/comment (admin)
 *     tags: [Purchase Management]
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
 *         description: Purchase updated
 */
router.patch('/api/v1/purchases/:id', authMiddleware, PurchaseController.update);

/**
 * @swagger
 * /api/v1/purchases/{id}/promote:
 *   post:
 *     summary: Credit purchase to user account (admin)
 *     tags: [Purchase Management]
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
 *         description: Purchase promoted and VIP extended
 */
router.post('/api/v1/purchases/:id/promote', authMiddleware, PurchaseController.promote);

module.exports = router;
```

---

### Task B5: Purchase + Assets Unit Tests

**Files:**
- Create: `tests/unit/services/purchaseService.test.js`
- Create: `tests/unit/services/assetsService.test.js`

**purchaseService.test.js — test cases:**
1. `submit()` — creates purchase with user info
2. `getAllPurchases()` — pagination + keyword search
3. `getPurchaseById()` — found and not found
4. `updatePurchase()` — updates status/comment
5. `promotePurchase()` — calculates VIP duration correctly (with 20% bonus)

**assetsService.test.js — test cases:**
1. `sendToken()` — successful transfer updates balances
2. `sendToken()` — returns false when sender not found
3. `sendToken()` — returns false when insufficient balance
4. `_createOrder()` — creates order with UUID

---

## Track C: Rate + WeChat Module

**Scope:** 5 REST endpoints, 1 model, 2 services, 2 controllers, 2 route files, tests
**Complexity:** Medium
**Estimated time:** 10-15 min

### Task C1: Create Exchange Rate Model

**Files:**
- Create: `app/models/clExchangeRatesModel.js`

**Note:** `dataExchangeRateModel.js` already exists for USD-to-other rates. This model stores the pre-computed rates data (from the old `cl_exchange_rates` collection).

```javascript
const mongoose = require('mongoose');

const ClExchangeRatesSchema = new mongoose.Schema(
  {
    currency: { type: String, trim: true },
    frate: { type: Number },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'cl_exchange_rates',
  },
);

module.exports = mongoose.model('ClExchangeRates', ClExchangeRatesSchema);
```

---

### Task C2: Create Rate Service, Controller, and Routes

**Files:**
- Create: `app/services/rateService.js`
- Create: `app/controllers/rateController.js`
- Create: `app/routes/rateRoutes.js`

**rateService.js:**

```javascript
const ClExchangeRatesModel = require('../models/clExchangeRatesModel');

class RateService {
  async getRmbRateList() {
    const legalCoins = ['cny', 'usd', 'eur', 'hkd', 'jpy', 'krw', 'aud', 'cad', 'rub'];
    const virtualCoins = ['btc', 'eth', 'ltc', 'bch'];

    const rates = await ClExchangeRatesModel.find({
      $or: [
        { currency: { $in: legalCoins } },
        { currency: { $in: virtualCoins } },
      ],
    }).lean();

    // Sort: virtual coins first, then legal tender
    const virtual = rates.filter((r) => virtualCoins.includes(r.currency));
    const legal = rates.filter((r) => legalCoins.includes(r.currency));

    return { list: [...virtual, ...legal] };
  }
}

module.exports = new RateService();
```

**rateController.js:**

```javascript
const RateService = require('../services/rateService');
const ResponseHandler = require('../utils/responseHandler');

class RateController {
  async rmbRateList(req, res) {
    const data = await RateService.getRmbRateList();
    return ResponseHandler.success(res, data);
  }
}

module.exports = new RateController();
```

**rateRoutes.js:**

```javascript
const express = require('express');
const RateController = require('../controllers/rateController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/rates:
 *   get:
 *     summary: Get exchange rate list (RMB-based)
 *     tags: [Exchange Rates]
 *     responses:
 *       200:
 *         description: Exchange rate list (virtual coins first, then legal tender)
 */
router.get('/api/v1/rates', RateController.rmbRateList);

module.exports = router;
```

---

### Task C3: Create WeChat Service, Controller, and Routes

**Files:**
- Create: `app/services/wechatService.js`
- Create: `app/controllers/wechatController.js`
- Create: `app/routes/wechatRoutes.js`

**wechatService.js:**

```javascript
const crypto = require('crypto');
const axios = require('axios');
const CommonConfigService = require('./commonConfigService');
const logger = require('../utils/logger');
const config = require('../../config');

class WechatService {
  /**
   * Validate WeChat server token
   */
  checkToken({ signature, timestamp, nonce, echostr }) {
    const tokenStr = config.wechat?.tokenStr || '';
    const arr = [tokenStr, timestamp, nonce].sort();
    const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
    return hash === signature ? echostr : 'Invalid signature';
  }

  /**
   * Get WeChat API access token (cached, refreshed every 2 hours)
   */
  async getAccessToken() {
    const cached = await CommonConfigService.getAccessToken();
    if (cached && cached.access_token) {
      const age = Date.now() - new Date(cached.updated_at || 0).getTime();
      if (age < 2 * 60 * 60 * 1000) {
        return cached;
      }
    }
    return await this._refreshAccessToken();
  }

  async _refreshAccessToken() {
    const appID = config.wechat?.appID;
    const secret = config.wechat?.appSecret;
    if (!appID || !secret) {
      logger.error('[wechat] Missing appID or appSecret in config');
      return null;
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${secret}`;
    const res = await axios.get(url);

    if (res.data && res.data.access_token) {
      const tokenData = { access_token: res.data.access_token, updated_at: new Date() };
      await CommonConfigService.setAccessToken(tokenData);
      return tokenData;
    }

    logger.error(`[wechat] Failed to refresh access token: ${JSON.stringify(res.data)}`);
    return null;
  }

  /**
   * Create WeChat custom menu
   */
  async createMenu(accessToken, menu) {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    const res = await axios.post(url, menu);
    return res.data;
  }

  /**
   * Delete WeChat custom menu
   */
  async deleteMenu(accessToken) {
    const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${accessToken}`;
    const res = await axios.get(url);
    return res.data;
  }
}

module.exports = new WechatService();
```

**wechatController.js:**

```javascript
const WechatService = require('../services/wechatService');
const ResponseHandler = require('../utils/responseHandler');
const config = require('../../config');

class WechatController {
  async checkToken(req, res) {
    const result = WechatService.checkToken(req.query);
    return res.send(result);
  }

  async getAccessToken(req, res) {
    const data = await WechatService.getAccessToken();
    return ResponseHandler.success(res, data);
  }

  async createMenu(req, res) {
    const tokenData = await WechatService.getAccessToken();
    if (!tokenData || !tokenData.access_token) {
      return ResponseHandler.fail(res, 500, 1, 'Failed to get access token');
    }
    const menu = config.wechat?.menu || {};
    const data = await WechatService.createMenu(tokenData.access_token, menu);
    return ResponseHandler.success(res, data);
  }

  async deleteMenu(req, res) {
    const tokenData = await WechatService.getAccessToken();
    if (!tokenData || !tokenData.access_token) {
      return ResponseHandler.fail(res, 500, 1, 'Failed to get access token');
    }
    const data = await WechatService.deleteMenu(tokenData.access_token);
    return ResponseHandler.success(res, data);
  }
}

module.exports = new WechatController();
```

**wechatRoutes.js:**

```javascript
const express = require('express');
const WechatController = require('../controllers/wechatController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/wechat/check-token:
 *   get:
 *     summary: Validate WeChat server token
 *     tags: [WeChat Integration]
 *     parameters:
 *       - in: query
 *         name: signature
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timestamp
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: nonce
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: echostr
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns echostr if valid
 */
router.get('/api/v1/wechat/check-token', WechatController.checkToken);

/**
 * @swagger
 * /api/v1/wechat/access-token:
 *   get:
 *     summary: Get WeChat API access token
 *     tags: [WeChat Integration]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Access token data
 */
router.get('/api/v1/wechat/access-token', authMiddleware, WechatController.getAccessToken);

/**
 * @swagger
 * /api/v1/wechat/menu:
 *   post:
 *     summary: Create WeChat custom menu
 *     tags: [WeChat Integration]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Menu creation result
 */
router.post('/api/v1/wechat/menu', authMiddleware, WechatController.createMenu);

/**
 * @swagger
 * /api/v1/wechat/menu:
 *   delete:
 *     summary: Delete WeChat custom menu
 *     tags: [WeChat Integration]
 *     security:
 *       - tokenAuth: []
 *     responses:
 *       200:
 *         description: Menu deletion result
 */
router.delete('/api/v1/wechat/menu', authMiddleware, WechatController.deleteMenu);

module.exports = router;
```

---

### Task C4: Rate + WeChat Unit Tests

**Files:**
- Create: `tests/unit/services/rateService.test.js`
- Create: `tests/unit/services/wechatService.test.js`

**rateService.test.js — test cases:**
1. `getRmbRateList()` — returns virtual coins before legal tender
2. `getRmbRateList()` — returns empty list when no data

**wechatService.test.js — test cases:**
1. `checkToken()` — returns echostr for valid signature
2. `checkToken()` — returns error string for invalid signature
3. `getAccessToken()` — returns cached token if fresh (< 2 hours)
4. `getAccessToken()` — refreshes token if stale
5. `createMenu()` — calls WeChat API with correct URL
6. `deleteMenu()` — calls WeChat API with correct URL

**Mock:** Mock `axios` for external API calls, mock `CommonConfigService` for token caching.

---

## Track D: Frontend Stub Pages

**Scope:** 3 pages in moow-web-next (Fund, About, Error 404)
**Complexity:** Low-Medium (Fund is medium due to charts)
**Estimated time:** 10-15 min
**Repo:** `/path/to/moow-web-next`

### Task D1: Complete About Page

**Files:**
- Modify: `src/app/about/page.tsx`

**Implementation:** Static content page with i18n. The old Vue About page was also just a stub heading, so create a simple informational page about the platform.

```tsx
/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useTranslation } from 'react-i18next';

const aboutStyle = css`
  .about-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
  }
  .about-container h1 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
  .about-container h2 {
    font-size: 1.3rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
  .about-container p {
    line-height: 1.8;
    color: #555;
    margin-bottom: 1rem;
  }
`;

export default function AboutPage() {
  const { t } = useTranslation('');

  return (
    <div css={aboutStyle}>
      <div className="about-container box">
        <h1>{t('about_xiaobo')}</h1>
        <p>
          Moow is a cryptocurrency automated investment platform that helps users implement
          Dollar-Cost Averaging (DCA) and intelligent investment strategies across major
          crypto exchanges.
        </p>

        <h2>{t('about_xbt')}</h2>
        <p>
          XBT is the platform token that rewards users for participation. Earn XBT through
          registration, inviting friends, and purchasing membership plans.
        </p>
      </div>
    </div>
  );
}
```

---

### Task D2: Complete Error 404 Page

**Files:**
- Modify: `src/app/error/page.tsx`
- Also: `src/app/not-found.tsx` (Next.js built-in 404)

**error/page.tsx:**

```tsx
/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

const errorStyle = css`
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    padding: 2rem;
  }
  .error-code {
    font-size: 6rem;
    font-weight: bold;
    color: #dbdbdb;
    margin-bottom: 1rem;
  }
  .error-message {
    font-size: 1.2rem;
    color: #7a7a7a;
    margin-bottom: 2rem;
  }
`;

export default function ErrorPage() {
  const { t } = useTranslation('');

  return (
    <div css={errorStyle}>
      <div className="error-container">
        <div className="error-code">404</div>
        <p className="error-message">{t('page_not_found')}</p>
        <Link href="/" className="button is-primary">
          {t('back_to_home')}
        </Link>
      </div>
    </div>
  );
}
```

**not-found.tsx** (create if not exists — Next.js auto-renders this for 404s):

```tsx
/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import Link from 'next/link';

const notFoundStyle = css`
  .nf-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
  }
  .nf-code {
    font-size: 6rem;
    font-weight: bold;
    color: #dbdbdb;
  }
  .nf-text {
    font-size: 1.2rem;
    color: #7a7a7a;
    margin: 1rem 0 2rem;
  }
`;

export default function NotFound() {
  return (
    <div css={notFoundStyle}>
      <div className="nf-container">
        <div className="nf-code">404</div>
        <p className="nf-text">Page not found</p>
        <Link href="/" className="button is-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
```

---

### Task D3: Complete Fund Page

**Files:**
- Modify: `src/app/fund/page.tsx`

**Note:** The old Vue Fund page displayed 2 hardcoded fund cards with Highcharts line charts. Since there's no backend fund API, this page uses static/placeholder data. The chart integration follows the Highcharts pattern already used elsewhere in the project.

```tsx
/** @jsxImportSource @emotion/react */
'use client';

import { css } from '@emotion/react';
import { useTranslation } from 'react-i18next';

const fundStyle = css`
  .fund-container {
    max-width: 1024px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }
  .fund-card {
    margin-bottom: 2rem;
    padding: 1.5rem;
  }
  .fund-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .fund-name {
    font-size: 1.3rem;
    font-weight: 600;
  }
  .fund-status {
    color: #48c774;
    font-weight: 500;
  }
  .fund-metrics {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .metric-item {
    text-align: center;
  }
  .metric-label {
    font-size: 0.85rem;
    color: #7a7a7a;
  }
  .metric-value {
    font-size: 1.1rem;
    font-weight: 600;
  }
  .positive {
    color: #48c774;
  }
  .negative {
    color: #f14668;
  }
  .fund-placeholder {
    height: 200px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b5b5b5;
  }
`;

export default function FundPage() {
  const { t } = useTranslation('');

  const funds = [
    {
      name: t('b10_index_fund'),
      status: t('status_open') || 'Open',
      metrics: [
        { label: t('change_24h') || '24h', value: '+2.3%', positive: true },
        { label: t('change_week') || '7d', value: '-1.2%', positive: false },
        { label: t('change_month') || '30d', value: '+8.7%', positive: true },
      ],
      size: '125,000 USDT',
    },
    {
      name: t('xiaobao_fund'),
      status: t('status_open') || 'Open',
      metrics: [
        { label: t('change_24h') || '24h', value: '+0.8%', positive: true },
        { label: t('change_week') || '7d', value: '+3.5%', positive: true },
        { label: t('change_month') || '30d', value: '+12.1%', positive: true },
      ],
      size: '80,000 USDT',
    },
  ];

  return (
    <div css={fundStyle}>
      <div className="fund-container">
        <h1 className="title is-4">{t('index_fund')}</h1>

        {funds.map((fund, idx) => (
          <div key={idx} className="box fund-card">
            <div className="fund-header">
              <span className="fund-name">{fund.name}</span>
              <span className="fund-status">{fund.status}</span>
            </div>

            <div className="fund-metrics">
              {fund.metrics.map((m, i) => (
                <div key={i} className="metric-item">
                  <div className="metric-label">{m.label}</div>
                  <div className={`metric-value ${m.positive ? 'positive' : 'negative'}`}>
                    {m.value}
                  </div>
                </div>
              ))}
              <div className="metric-item">
                <div className="metric-label">{t('fund_size')}</div>
                <div className="metric-value">{fund.size}</div>
              </div>
            </div>

            <div className="fund-placeholder">Chart placeholder — integrate Highcharts when backend fund API is available</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Execution

### Parallel Window Commands

**Window 1 — Track A (RBAC):**

```bash
cd /Users/zyao0693/Desktop/www/moow-api-express

claude --dangerously-skip-permissions -p "Read docs/plans/2026-02-15-moow-phase3-implementation-plan.md. Execute ONLY Track A tasks (A1-A7). After all tasks, run npm run lint && npm test to verify. Then create a worktree on branch feature/phase3-rbac, commit with 'feat: add RBAC role and resource management module', push and create a PR."
```

**Window 2 — Track B (Purchase + Assets):**

```bash
cd /Users/zyao0693/Desktop/www/moow-api-express

claude --dangerously-skip-permissions -p "Read docs/plans/2026-02-15-moow-phase3-implementation-plan.md. Execute ONLY Track B tasks (B1-B5). After all tasks, run npm run lint && npm test to verify. Then create a worktree on branch feature/phase3-purchase-assets, commit with 'feat: add purchase and assets token management module', push and create a PR."
```

**Window 3 — Track C (Rate + WeChat):**

```bash
cd /Users/zyao0693/Desktop/www/moow-api-express

claude --dangerously-skip-permissions -p "Read docs/plans/2026-02-15-moow-phase3-implementation-plan.md. Execute ONLY Track C tasks (C1-C4). After all tasks, run npm run lint && npm test to verify. Then create a worktree on branch feature/phase3-rate-wechat, commit with 'feat: add exchange rate and WeChat integration module', push and create a PR."
```

**Window 4 — Track D (Frontend Stubs):**

```bash
cd /Users/zyao0693/Desktop/www/moow-web-next

claude --dangerously-skip-permissions -p "Read /Users/zyao0693/Desktop/www/moow-api-express/docs/plans/2026-02-15-moow-phase3-implementation-plan.md. Execute ONLY Track D tasks (D1-D3). After all tasks, run npm run lint to verify. Then create a worktree on branch feature/phase3-frontend-stubs, commit with 'feat: complete fund, about, and error pages', push and create a PR."
```

### Merge Order

All 4 PRs are independent. Merge in any order (squash merge recommended). After all merged:

1. Pull latest main in both repos
2. Clean up worktrees and branches
3. Run full test suite to confirm no regressions

---

## Summary

| Track | Window | Module | Tasks | Files Created | Endpoints |
|-------|--------|--------|-------|---------------|-----------|
| A | 1 | RBAC | A1-A7 | 10 | 12 |
| B | 2 | Purchase + Assets | B1-B5 | 8 | 5 |
| C | 3 | Rate + WeChat | C1-C4 | 7 | 5 |
| D | 4 | Frontend Stubs | D1-D3 | 3-4 | — |

**Total: 20 tasks, ~29 new files, 22 new endpoints, 3 frontend pages**
**Estimated parallel execution time: 15-20 minutes**
