import { Router } from 'express';
import { mapController } from '../controllers/maps';
import { authenticate } from '../middleware/auth';

const router = Router();

// All map routes require authentication
router.use(authenticate);

// Map CRUD
router.get('/', mapController.getMaps);
router.post('/', mapController.createMap);
router.get('/:id', mapController.getMap);
router.put('/:id', mapController.updateMap);
router.delete('/:id', mapController.deleteMap);

// AI map generation
router.post('/generate', mapController.generateMap);
router.post('/generate/preview', mapController.generateMapPreview);

// Map templates
router.get('/templates', mapController.getTemplates);
router.post('/templates', mapController.createTemplate);

// Map sharing
router.post('/:id/share', mapController.shareMap);
router.post('/:id/unshare', mapController.unshareMap);
router.post('/:id/fork', mapController.forkMap);

// Map validation
router.post('/:id/validate', mapController.validateMap);

export default router; 