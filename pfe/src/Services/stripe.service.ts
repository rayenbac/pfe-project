import { injectable } from 'inversify';
import Stripe from 'stripe';
import { StripePayment } from '../Models/stripePayment';
import { IStripePayment, IStripePaymentRepository } from '../Interfaces/payment/IStripePayment';
import { Document, Types } from 'mongoose';
import { logger } from '../Config/logger.config';
import { SignatureService } from './signature.service';
import "reflect-metadata";

@injectable()
class StripeService implements IStripePaymentRepository {
    private stripe: Stripe;
    private readonly PLATFORM_FEE_PERCENTAGE = 10; 
    private signatureService: SignatureService;

    constructor() {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
        }
        
        // Initialize Stripe with your secret key
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });
        
        this.signatureService = new SignatureService();
    }

    async createPaymentIntent(data: {
        amount: number;
        currency: string;
        propertyId: string;
        userId: string;
        agentId: string;
        metadata?: Record<string, any>;
        contractId?: string; // Add contract ID for signature validation
    }): Promise<{ clientSecret: string; paymentIntentId: string }> {
        try {
            // Validate signatures before allowing payment
            if (data.contractId) {
                const isReady = await this.signatureService.isContractReadyForPayment(data.contractId);
                if (!isReady) {
                    throw new Error('Contract must be signed by both parties before payment can be processed');
                }
            }

            // Convert amount to cents (Stripe requires amounts in cents)
            const amountInCents = Math.round(data.amount * 100);
            
            // Create a payment intent without application fee
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: data.currency,
                metadata: {
                    propertyId: data.propertyId,
                    userId: data.userId,
                    agentId: data.agentId,
                    ...data.metadata
                }
            });

            // Create a record in our database
            const stripePayment = new StripePayment({
                propertyId: new Types.ObjectId(data.propertyId),
                userId: new Types.ObjectId(data.userId),
                agentId: new Types.ObjectId(data.agentId),
                amount: data.amount,
                currency: data.currency,
                stripePaymentIntentId: paymentIntent.id,
                status: 'pending',
                metadata: data.metadata
            });

            await stripePayment.save();

            return {
                clientSecret: paymentIntent.client_secret!,
                paymentIntentId: paymentIntent.id
            };
        } catch (error) {
            logger.error('Error creating payment intent:', error);
            throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async confirmPayment(paymentIntentId: string): Promise<IStripePayment> {
        try {
            // Retrieve the payment intent from Stripe
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            
            // Update our database record
            const payment = await StripePayment.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntentId },
                { 
                    status: paymentIntent.status === 'succeeded' ? 'completed' : 
                            paymentIntent.status === 'canceled' ? 'failed' : 'pending',
                    paymentDate: paymentIntent.status === 'succeeded' ? new Date() : undefined
                },
                { new: true }
            );

            if (!payment) {
                throw new Error(`Payment with intent ID ${paymentIntentId} not found`);
            }

            return payment;
        } catch (error) {
            logger.error('Error confirming payment:', error);
            throw new Error(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPaymentByIntentId(paymentIntentId: string): Promise<IStripePayment | null> {
        try {
            return await StripePayment.findOne({ stripePaymentIntentId: paymentIntentId });
        } catch (error) {
            logger.error('Error getting payment by intent ID:', error);
            throw new Error(`Failed to get payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPaymentsByUser(userId: string): Promise<IStripePayment[]> {
        try {
            return await StripePayment.find({ userId: new Types.ObjectId(userId) })
                .populate('propertyId')
                .populate('agentId')
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by user:', error);
            throw new Error(`Failed to get payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPaymentsByProperty(propertyId: string): Promise<IStripePayment[]> {
        try {
            return await StripePayment.find({ propertyId: new Types.ObjectId(propertyId) })
                .populate('userId')
                .populate('agentId')
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by property:', error);
            throw new Error(`Failed to get payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getPaymentsByAgent(agentId: string): Promise<IStripePayment[]> {
        try {
            return await StripePayment.find({ agentId: new Types.ObjectId(agentId) })
                .populate('propertyId')
                .populate('userId')
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by agent:', error);
            throw new Error(`Failed to get payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async refundPayment(paymentIntentId: string, amount?: number): Promise<IStripePayment> {
        try {
            // Create a refund
            const refundParams: Stripe.RefundCreateParams = {
                payment_intent: paymentIntentId,
            };
            
            if (amount) {
                refundParams.amount = Math.round(amount * 100); // Convert to cents
            }
            
            const refund = await this.stripe.refunds.create(refundParams);
            
            // Update our database record
            const payment = await StripePayment.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntentId },
                { 
                    status: 'refunded',
                },
                { new: true }
            );

            if (!payment) {
                throw new Error(`Payment with intent ID ${paymentIntentId} not found`);
            }

            return payment;
        } catch (error) {
            logger.error('Error refunding payment:', error);
            throw new Error(`Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create a Stripe Connect account for an agent
    async createConnectAccount(agentId: string, email: string): Promise<string> {
        try {
            const account = await this.stripe.accounts.create({
                type: 'express',
                email: email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    agentId: agentId
                }
            });

            return account.id;
        } catch (error) {
            logger.error('Error creating Connect account:', error);
            throw new Error(`Failed to create Connect account: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create an account link for onboarding
    async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
        try {
            const accountLink = await this.stripe.accountLinks.create({
                account: accountId,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: 'account_onboarding',
            });

            return accountLink.url;
        } catch (error) {
            logger.error('Error creating account link:', error);
            throw new Error(`Failed to create account link: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create a checkout session for a property rental
    async createCheckoutSession(data: {
        propertyId: string;
        userId: string;
        agentId: string;
        amount: number;
        currency: string;
        successUrl: string;
        cancelUrl: string;
        metadata?: Record<string, any>;
    }): Promise<any> {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: data.currency,
                            product_data: {
                                name: 'Property Rental',
                                description: `Rental payment for property ID: ${data.propertyId}`,
                                metadata: {
                                    propertyId: data.propertyId
                                }
                            },
                            unit_amount: Math.round(data.amount * 100), // Convert to cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: data.successUrl, // Use the placeholder directly
                cancel_url: data.cancelUrl,
                metadata: {
                    propertyId: data.propertyId,
                    userId: data.userId,
                    agentId: data.agentId,
                    ...data.metadata
                }
            });

            // Retrieve the session to get the payment_intent
            const fullSession = await this.stripe.checkout.sessions.retrieve(session.id);
            if (fullSession.payment_intent) {
                const stripePayment = new StripePayment({
                    propertyId: new Types.ObjectId(data.propertyId),
                    userId: new Types.ObjectId(data.userId),
                    agentId: new Types.ObjectId(data.agentId),
                    amount: data.amount,
                    currency: data.currency,
                    stripePaymentIntentId: fullSession.payment_intent,
                    status: 'pending',
                    metadata: data.metadata
                });
                await stripePayment.save();
            }

            return session;
        } catch (error) {
            logger.error('Error creating checkout session:', error);
            throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public constructWebhookEvent(payload: any, signature: string, secret: string) {
        return this.stripe.webhooks.constructEvent(payload, signature, secret);
    }

    // Retrieve a Stripe Checkout Session by session_id
    async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
        try {
            return await this.stripe.checkout.sessions.retrieve(sessionId);
        } catch (error) {
            logger.error('Error retrieving Stripe Checkout Session:', error);
            throw new Error('Failed to retrieve Stripe Checkout Session');
        }
    }

    // Create a StripePayment record from a Checkout Session and PaymentIntent (for webhooks)
    async createPaymentFromCheckoutSession(session: any, paymentIntent: any): Promise<void> {
        try {
            // Check if payment already exists
            const existing = await StripePayment.findOne({ stripePaymentIntentId: paymentIntent.id });
            if (existing) return;

            // Extract metadata
            const metadata = session.metadata || {};
            const propertyId = metadata.propertyId;
            const userId = metadata.userId;
            const agentId = metadata.agentId;
            const amount = paymentIntent.amount / 100; // Stripe stores in cents
            const currency = paymentIntent.currency;

            const stripePayment = new StripePayment({
                propertyId,
                userId,
                agentId,
                amount,
                currency,
                stripePaymentIntentId: paymentIntent.id,
                status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
                paymentDate: paymentIntent.status === 'succeeded' ? new Date() : undefined,
                metadata: metadata
            });
            await stripePayment.save();
        } catch (error) {
            logger.error('Error creating payment from Checkout Session:', error);
        }
    }

    // Public method to retrieve a PaymentIntent by ID
    public async getPaymentIntentById(id: string): Promise<any> {
        return this.stripe.paymentIntents.retrieve(id);
    }
}

export { StripeService };