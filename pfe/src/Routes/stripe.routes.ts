import express from 'express';
import { StripeController } from '../Controllers/stripe.controller';
import { diContainer } from '../DI/iversify.config';
import { authenticateToken } from '../Middlewares/auth.middleware';

export const router = express.Router();

const controller = diContainer.get<StripeController>(Symbol.for("StripeController"));

// Create a payment intent
router.post('/create-payment-intent', authenticateToken, controller.createPaymentIntent);

// Confirm a payment
router.post('/confirm-payment', authenticateToken, controller.confirmPayment);

// Get payments by user
router.get('/user/:userId', authenticateToken, controller.getPaymentsByUser);

// Get payments by property
router.get('/property/:propertyId', authenticateToken, controller.getPaymentsByProperty);

// Get payments by agent
router.get('/agent/:agentId', authenticateToken, controller.getPaymentsByAgent);

// Process a refund
router.post('/refund', authenticateToken, controller.processRefund);

// Create a Connect account for an agent
router.post('/connect-account', authenticateToken, controller.createConnectAccount);

// Create an account link for onboarding
router.post('/account-link', authenticateToken, controller.createAccountLink);

// Create a checkout session
router.post('/create-checkout-session', authenticateToken, controller.createCheckoutSession);

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), controller.handleWebhook);

// Get payment details by Stripe session_id
router.get('/session/:sessionId', authenticateToken, controller.getPaymentBySessionId);

export default router;