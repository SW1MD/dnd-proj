import { Router } from 'express';
import { characterController } from '../controllers/characters';
import { authenticate } from '../middleware/auth';

const router = Router();

// All character routes require authentication
router.use(authenticate);

// Character CRUD
router.get('/', characterController.getCharacters);
router.post('/', characterController.createCharacter);
router.get('/:id', characterController.getCharacter);
router.put('/:id', characterController.updateCharacter);
router.delete('/:id', characterController.deleteCharacter);

// Character actions
router.post('/:id/level-up', characterController.levelUp);
router.post('/:id/rest', characterController.rest);
router.post('/:id/heal', characterController.heal);
router.post('/:id/damage', characterController.takeDamage);

// Character inventory
router.get('/:id/inventory', characterController.getInventory);
router.post('/:id/inventory', characterController.addItem);
router.put('/:id/inventory/:itemId', characterController.updateItem);
router.delete('/:id/inventory/:itemId', characterController.removeItem);

// Character spells
router.get('/:id/spells', characterController.getSpells);
router.post('/:id/spells', characterController.addSpell);
router.delete('/:id/spells/:spellId', characterController.removeSpell);

export default router; 