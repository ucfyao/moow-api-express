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
