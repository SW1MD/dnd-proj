import { Router } from 'express';
import { authController } from '../controllers/auth';
import { authRateLimiterMiddleware } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiterMiddleware);

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router; 