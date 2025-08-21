import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { StripeService } from '../Services/stripe.service';
import { logger } from '../Config/logger.config';
import { StripePaymentSchemaValidate } from '../Models/stripePayment';

@injectable()
class StripeController {
    private service: StripeService;

    constructor(@inject(Symbol.for("StripeService")) service: StripeService) {
        this.service = service;
    }

    // Create a payment intent
    createPaymentIntent = async (req: Request, res: Response) => {
        try {
            const { error, value } = StripePaymentSchemaValidate.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            const { propertyId, userId, agentId, amount, currency, metadata } = value;

            const result = await this.service.createPaymentIntent({
                propertyId,
                userId,
                agentId,
                amount,
                currency,
                metadata
            });

            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Error creating payment intent:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Confirm a payment
    confirmPayment = async (req: Request, res: Response) => {
        try {
            const { paymentIntentId } = req.body;
            if (!paymentIntentId) {
                return res.status(400).json({ message: 'Payment intent ID is required' });
            }

            const payment = await this.service.confirmPayment(paymentIntentId);
            res.status(200).json(payment);
        } catch (error: any) {
            logger.error('Error confirming payment:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Get payments by user
    getPaymentsByUser = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const payments = await this.service.getPaymentsByUser(userId);
            res.status(200).json(payments);
        } catch (error: any) {
            logger.error('Error getting payments by user:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Get payments by property
    getPaymentsByProperty = async (req: Request, res: Response) => {
        try {
            const propertyId = req.params.propertyId;
            const payments = await this.service.getPaymentsByProperty(propertyId);
            res.status(200).json(payments);
        } catch (error: any) {
            logger.error('Error getting payments by property:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Get payments by agent
    getPaymentsByAgent = async (req: Request, res: Response) => {
        try {
            const agentId = req.params.agentId;
            const payments = await this.service.getPaymentsByAgent(agentId);
            res.status(200).json(payments);
        } catch (error: any) {
            logger.error('Error getting payments by agent:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Process a refund
    processRefund = async (req: Request, res: Response) => {
        try {
            const { paymentIntentId, amount } = req.body;
            if (!paymentIntentId) {
                return res.status(400).json({ message: 'Payment intent ID is required' });
            }

            const payment = await this.service.refundPayment(paymentIntentId, amount);
            res.status(200).json(payment);
        } catch (error: any) {
            logger.error('Error processing refund:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Create a Connect account for an agent
    createConnectAccount = async (req: Request, res: Response) => {
        try {
            const { agentId, email } = req.body;
            if (!agentId || !email) {
                return res.status(400).json({ message: 'Agent ID and email are required' });
            }

            const accountId = await this.service.createConnectAccount(agentId, email);
            res.status(200).json({ accountId });
        } catch (error: any) {
            logger.error('Error creating Connect account:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Create an account link for onboarding
    createAccountLink = async (req: Request, res: Response) => {
        try {
            const { accountId, refreshUrl, returnUrl } = req.body;
            if (!accountId || !refreshUrl || !returnUrl) {
                return res.status(400).json({ message: 'Account ID, refresh URL, and return URL are required' });
            }

            const accountLinkUrl = await this.service.createAccountLink(accountId, refreshUrl, returnUrl);
            res.status(200).json({ url: accountLinkUrl });
        } catch (error: any) {
            logger.error('Error creating account link:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Create a checkout session
    createCheckoutSession = async (req: Request, res: Response) => {
        try {
            const { propertyId, userId, agentId, amount, currency, successUrl, cancelUrl, metadata } = req.body;
            
            if (!propertyId || !userId || !agentId || !amount || !currency || !successUrl || !cancelUrl) {
                return res.status(400).json({ 
                    message: 'Property ID, user ID, agent ID, amount, currency, success URL, and cancel URL are required' 
                });
            }

            // Log the URLs for debugging
            logger.info('Stripe Checkout URLs:', { successUrl, cancelUrl });

            // Validate URLs
            const urlPattern = /^https?:\/\//i;
            if (!urlPattern.test(successUrl)) {
                logger.error('Invalid successUrl sent to Stripe:', successUrl);
                return res.status(400).json({ message: 'Invalid successUrl: must start with http:// or https://', successUrl });
            }
            if (!urlPattern.test(cancelUrl)) {
                logger.error('Invalid cancelUrl sent to Stripe:', cancelUrl);
                return res.status(400).json({ message: 'Invalid cancelUrl: must start with http:// or https://', cancelUrl });
            }

            const session = await this.service.createCheckoutSession({
                propertyId,
                userId,
                agentId,
                amount,
                currency,
                successUrl,
                cancelUrl,
                metadata
            });

            res.status(200).json({ url: session.url });
        } catch (error: any) {
            logger.error('Error creating checkout session:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Webhook handler for Stripe events
    handleWebhook = async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'] as string;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!endpointSecret) {
            return res.status(500).json({ message: 'Webhook secret is not configured' });
        }

        try {
            const event = this.service.constructWebhookEvent(
                req.body,
                sig,
                endpointSecret
            );

            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    await this.service.confirmPayment(paymentIntent.id);
                    break;
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    if (session.payment_intent && typeof session.payment_intent === 'string') {
                        // Retrieve the PaymentIntent from Stripe using the public method
                        const paymentIntent = await this.service.getPaymentIntentById(session.payment_intent);
                        await this.service.createPaymentFromCheckoutSession(session, paymentIntent);
                    }
                    break;
                }
                case 'payment_intent.payment_failed':
                    // Handle failed payment
                    break;
                // Add more event handlers as needed
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.status(200).json({ received: true });
        } catch (error: any) {
            logger.error('Error handling webhook:', error);
            res.status(400).json({ message: `Webhook Error: ${error.message}` });
        }
    }

    // Get payment by Stripe session_id
    getPaymentBySessionId = async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            if (!sessionId) {
                return res.status(400).json({ message: 'Session ID is required' });
            }
            // Retrieve the session from Stripe
            const session = await this.service.getCheckoutSession(sessionId);
            if (!session || !session.payment_intent) {
                return res.status(404).json({ message: 'Stripe session or payment intent not found' });
            }
            // Get payment by payment_intent
            const payment = await this.service.getPaymentByIntentId(session.payment_intent as string);
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }
            res.status(200).json(payment);
        } catch (error: any) {
            logger.error('Error getting payment by session ID:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

export { StripeController };