import { Router } from 'express';
import { userController } from '../controllers/users';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);

// User statistics
router.get('/stats', userController.getStats);

// Friends management
router.get('/friends', userController.getFriends);
router.post('/friends/request', userController.sendFriendRequest);
router.post('/friends/accept/:requestId', userController.acceptFriendRequest);
router.post('/friends/decline/:requestId', userController.declineFriendRequest);
router.delete('/friends/:friendId', userController.removeFriend);

// User settings
router.get('/settings', userController.getSettings);
router.put('/settings', userController.updateSettings);

export default router; 