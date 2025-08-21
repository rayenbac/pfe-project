import { Router } from 'express';
import { AgencyController } from '../Controllers/agency.controller';
import { diContainer } from '../DI/iversify.config';
import { AgencyTYPES } from '../DI/Agency/AgencyTypes';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const agencyController = diContainer.get<AgencyController>(AgencyTYPES.agencyController);

// Get all agencies
router.get('/', agencyController.getAgencies);

// Get a single agency
router.get('/:id', agencyController.getAgency);

// Create a new agency
router.post('/', upload.single('logo'), agencyController.createAgency);

// Update an agency
router.put('/:id', upload.single('logo'), agencyController.updateAgency);

// Delete an agency
router.delete('/:id', agencyController.deleteAgency);

// Get agency agents
router.get('/:id/agents', agencyController.getAgencyAgents);

// Search agencies
router.get('/search', agencyController.searchAgencies);

export default router; 