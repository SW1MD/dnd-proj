"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(rateLimiter_1.authRateLimiterMiddleware);
router.post('/register', auth_1.authController.register);
router.post('/login', auth_1.authController.login);
router.post('/logout', auth_1.authController.logout);
router.post('/refresh', auth_1.authController.refresh);
router.post('/verify-email', auth_1.authController.verifyEmail);
router.post('/forgot-password', auth_1.authController.forgotPassword);
router.post('/reset-password', auth_1.authController.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.js.map