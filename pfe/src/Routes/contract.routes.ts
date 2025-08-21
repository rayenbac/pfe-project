import { Router } from 'express';
import { ContractController } from '../Controllers/contract.controller';
import { authenticateToken, authorizeRoles } from '../Middlewares/auth.middleware';
import { UserRole } from '../Constants/enums';

const router = Router();
const contractController = new ContractController();

// User Contract Routes (Authenticated users only)
router.get('/my-contracts', authenticateToken, contractController.getAgentContracts);
router.get('/client-contracts', authenticateToken, contractController.getClientContracts);
router.get('/stats', authenticateToken, contractController.getContractStats);
router.get('/:id', authenticateToken, contractController.getContract);
router.get('/:contractId/download', authenticateToken, contractController.downloadContractPDF);
router.get('/:contractId/pdf', authenticateToken, contractController.generateContractPDF);

// Contract Management (Agents and Clients)
router.post('/', authenticateToken, contractController.createContract);
router.post('/from-reservation', authenticateToken, contractController.createContractFromReservation);
router.put('/:id', authenticateToken, contractController.updateContract);
router.put('/:id/sign', authenticateToken, contractController.signContract);
router.delete('/:id', authenticateToken, contractController.deleteContract);

// Admin Contract Routes (Admin only)
router.get('/admin/all', 
  authenticateToken, 
  authorizeRoles([UserRole.ADMIN]), 
  contractController.getAllContractsAdmin
);

router.get('/admin/stats', 
  authenticateToken, 
  authorizeRoles([UserRole.ADMIN]), 
  contractController.getAdminContractStats
);

router.post('/admin/:contractId/revoke', 
  authenticateToken, 
  authorizeRoles([UserRole.ADMIN]), 
  contractController.revokeContract
);

router.post('/admin/check-deadlines', 
  authenticateToken, 
  authorizeRoles([UserRole.ADMIN]), 
  contractController.checkOfflinePaymentDeadlines
);

export default router;
