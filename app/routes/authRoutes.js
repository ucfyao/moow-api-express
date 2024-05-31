const express = require("express");
const AuthController = require("../controllers/authController");
const validateParams = require("../middlewares/validateMiddleware");
const { signinValidatorSchema } = require("../validators/authValidator");

const router = express.Router();

router.get("/captcha", AuthController.getCaptcha);
router.post("/auth/login", validateParams(signinValidatorSchema), AuthController.signin);

module.exports = router;
