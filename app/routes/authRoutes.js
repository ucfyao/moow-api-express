const express = require("express");
const AuthController = require("../controllers/authController");
const validateParams = require("../middlewares/validateMiddleware");
const { signinValidatorSchema, exitValidatorSchema } = require("../validators/authValidator");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/captcha", AuthController.getCaptcha);
router.post("/auth/login", validateParams(signinValidatorSchema), AuthController.signin);
router.delete("/auth/logout", validateParams(exitValidatorSchema), authMiddleware, AuthController.exit);

module.exports = router;
