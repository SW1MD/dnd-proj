import { Router } from 'express';
import { socialController } from '../controllers/social';
import { authenticate } from '../middleware/auth';

const router = Router();

// All social routes require authentication
router.use(authenticate);

// FRIENDS ROUTES
router.get('/friends', socialController.getFriends);
router.post('/friends/request', socialController.sendFriendRequest);
router.get('/friends/requests', socialController.getFriendRequests);
router.post('/friends/requests/:requestId/respond', socialController.respondToFriendRequest);
router.delete('/friends/:friendshipId', socialController.removeFriend);

// MESSAGING ROUTES
router.get('/conversations', socialController.getConversations);
router.get('/messages/:partnerId', socialController.getMessages);
router.post('/messages', socialController.sendMessage);

// GAME INVITATIONS ROUTES
router.post('/game-invitations', socialController.sendGameInvitation);
router.get('/game-invitations', socialController.getGameInvitations);
router.post('/game-invitations/:invitationId/respond', socialController.respondToGameInvitation);

// USER PROFILE ROUTES
router.get('/profile/:userId', socialController.getUserProfile);
router.put('/profile', socialController.updateUserProfile);

// POSTS ROUTES
router.get('/posts', socialController.getPostsFeed);
router.post('/posts', socialController.createPost);

// NOTIFICATIONS ROUTES
router.get('/notifications', socialController.getNotifications);
router.put('/notifications/read', socialController.markNotificationsAsRead);

export default router; 