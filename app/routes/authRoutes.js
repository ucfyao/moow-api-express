const express = require("express");
const AuthController = require("../controllers/authController");

const router = express.Router();

router.get("/captcha", AuthController.getCaptcha);

module.exports = router;
