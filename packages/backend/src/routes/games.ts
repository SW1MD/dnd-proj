import { Router } from 'express';
import { gameController } from '../controllers/games';
import { authenticate } from '../middleware/auth';

const router = Router();

// All game routes require authentication
router.use(authenticate);

// General dice rolling (not tied to a specific game)
router.post('/dice/roll', gameController.rollDice);

// Game session CRUD
router.get('/', gameController.getGames);
router.post('/', gameController.createGame);
router.get('/:id', gameController.getGame);
router.put('/:id', gameController.updateGame);
router.delete('/:id', gameController.deleteGame);

// Game session management
router.post('/:id/join', gameController.joinGame);
router.post('/:id/leave', gameController.leaveGame);
router.post('/:id/start', gameController.startGame);
router.post('/:id/pause', gameController.pauseGame);
router.post('/:id/resume', gameController.resumeGame);
router.post('/:id/end', gameController.endGame);

// Game actions
router.get('/:id/actions', gameController.getActions);
router.post('/:id/actions', gameController.createAction);
router.put('/:id/actions/:actionId', gameController.updateAction);

// Game events
router.get('/:id/events', gameController.getEvents);
router.post('/:id/events', gameController.createEvent);

// Dice rolls
router.get('/:id/dice-rolls', gameController.getDiceRolls);
router.post('/:id/dice-rolls', gameController.rollDice);

// Chat messages
router.get('/:id/chat', gameController.getChatMessages);
router.post('/:id/chat', gameController.sendChatMessage);
router.delete('/:id/chat/:messageId', gameController.deleteChatMessage);

export default router; 