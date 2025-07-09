import { Router } from 'express';
import { diceController } from '../controllers/dice';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public dice rolling (no auth required for basic dice functionality)
router.post('/roll', diceController.rollDice);

// Protected routes (require authentication)
router.get('/history', authenticate, diceController.getDiceHistory);

export default router; 