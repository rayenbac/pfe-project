import { Router } from 'express';
import { SignatureController } from '../Controllers/signature.controller';
import { authenticateToken } from '../Middlewares/auth.middleware';

const router = Router();
const signatureController = new SignatureController();

// Agent signature management routes
router.post('/agent/signature', authenticateToken, signatureController.saveAgentSignature);
router.get('/agent/signature/:agentId?', authenticateToken, signatureController.getAgentSignature);

// Contract signing routes
router.post('/contract/create', authenticateToken, signatureController.createContract);
router.post('/contract/create-from-reservation', authenticateToken, signatureController.createContractFromReservation);
router.get('/contract/:contractId/info', authenticateToken, signatureController.getContractSigningInfo);
router.get('/contract/:contractId/signing', authenticateToken, signatureController.getContractForSigning);
router.post('/contract/:contractId/sign/agent', authenticateToken, signatureController.signContractAsAgent);
router.post('/contract/:contractId/sign/client', authenticateToken, signatureController.signContractAsClient);

// Contract verification and status routes
router.get('/contract/:contractId/verify', authenticateToken, signatureController.verifyContractSignatures);
router.get('/contract/:contractId/payment-ready', authenticateToken, signatureController.checkContractPaymentReadiness);
router.get('/contract/:contractId/download', authenticateToken, signatureController.downloadSignedContract);

export default router;
