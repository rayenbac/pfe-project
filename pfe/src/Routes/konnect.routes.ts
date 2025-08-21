import express from 'express';
import { KonnectController } from '../Controllers/konnect.controller';
import { diContainer } from '../DI/iversify.config';
import { authenticateToken } from '../Middlewares/auth.middleware';

export const router = express.Router();

const controller = diContainer.get<KonnectController>(Symbol.for("KonnectController"));

// Create a payment
router.post('/create-payment', authenticateToken, controller.createPayment);

// Test endpoint to simulate successful payment (development only)
router.post('/simulate-success', controller.simulateSuccessfulPayment);

// Get payment details
router.get('/payment/:paymentId', authenticateToken, controller.getPaymentDetails);

// Webhook endpoints - handle both GET and POST
router.get('/webhook', controller.handleWebhook);
router.post('/webhook', express.json(), controller.handleWebhook);

export default router;