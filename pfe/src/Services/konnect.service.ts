import { injectable } from 'inversify';
import axios from 'axios';
import { KonnectPayment } from '../Models/konnectPayment';
import { IKonnectPayment, IKonnectPaymentRepository } from '../Interfaces/payment/IKonnectPayment';
import { Types } from 'mongoose';
import { logger } from '../Config/logger.config';
import { SignatureService } from './signature.service';
import "reflect-metadata";

@injectable()
export class KonnectService implements IKonnectPaymentRepository {
    private readonly apiUrl: string;
    private readonly apiKey: string;
    private readonly walletId: string;
    private signatureService: SignatureService;

    constructor() {
        if (!process.env.KONNECT_API_KEY || !process.env.KONNECT_WALLET_ID) {
            throw new Error('Konnect configuration is missing');
        }
        
        this.apiKey = process.env.KONNECT_API_KEY;
        this.walletId = process.env.KONNECT_WALLET_ID;
        // Fix the API URL
        this.apiUrl = 'https://api.sandbox.konnect.network/api/v2';
        this.signatureService = new SignatureService();
    }

    async createPayment(data: {
        amount: number;
        propertyId: string;
        userId: string;
        agentId: string;
        userEmail: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        currency?: string;
        metadata?: Record<string, any>;
        contractId?: string; // Add contract ID for signature validation
    }): Promise<{ paymentUrl: string; paymentId: string }> {
        try {
            // Validate signatures before allowing payment
            if (data.contractId) {
                const isReady = await this.signatureService.isContractReadyForPayment(data.contractId);
                if (!isReady) {
                    throw new Error('Contract must be signed by both parties before payment can be processed');
                }
            }

            console.log('Creating Konnect payment with data:', {
                amount: data.amount,
                amountInMillimes: Math.round(data.amount * 1000),
                currency: data.currency || "TND",
                propertyId: data.propertyId,
                userEmail: data.userEmail,
                contractId: data.contractId
            });

            const paymentRequest = {
                receiverWalletId: this.walletId,
                token: data.currency || "TND",
                amount: Math.min(
                    Math.max(
                        Math.round(data.amount * 1000), // Convert TND to millimes
                        100  // minimum 0.100 TND (100 millimes)
                    ),
                    10000000 // maximum 10,000 TND (10,000,000 millimes)
                ),
                type: "immediate",
                description: `Property booking: ${data.metadata?.propertyTitle || 'Real Estate Property'}`,
                acceptedPaymentMethods: ["wallet", "bank_card", "e-DINAR"],
                lifespan: 60, // 60 minutes session
                checkoutForm: true,
                addPaymentFeesToAmount: false,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                email: data.userEmail,
                orderId: `PROP-${data.propertyId}-${Date.now()}`, // Clear order ID format
                theme: "light",
                webhook: process.env.KONNECT_WEBHOOK_URL,
                successUrl: `${process.env.FRONTEND_URL}/payment/success`,
                failUrl: `${process.env.FRONTEND_URL}/payment/failure`,
                // Additional configuration for better success rate
                silentWebhook: false, // Enable webhook notifications
                developer_tracking: data.metadata?.sessionId || Date.now().toString()
            };

            console.log('Konnect API request:', JSON.stringify(paymentRequest, null, 2));

            const response = await axios.post(`${this.apiUrl}/payments/init-payment`, paymentRequest, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });

            console.log('Konnect API response:', response.data);

            // Create payment record in database
            const konnectPayment = new KonnectPayment({
                propertyId: new Types.ObjectId(data.propertyId),
                userId: new Types.ObjectId(data.userId),
                agentId: new Types.ObjectId(data.agentId),
                amount: data.amount,
                currency: data.currency || 'TND',
                konnectPaymentId: response.data.paymentRef,
                status: 'pending',
                metadata: {
                    ...data.metadata,
                    userEmail: data.userEmail,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneNumber: data.phoneNumber
                }
            });

            await konnectPayment.save();

            return {
                paymentUrl: response.data.payUrl, // Changed from paymentUrl to payUrl
                paymentId: response.data.paymentRef
            };
        } catch (error: any) {
            logger.error('Konnect API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    async handleWebhook(payload: any): Promise<void> {
        try {
            const { paymentRef, status, orderId } = payload;
            await KonnectPayment.findOneAndUpdate(
                { konnectPaymentId: paymentRef },
                {   
                    status: status.toLowerCase(),
                    paymentDate: new Date()
                }
            );
            // Emit event or trigger additional business logic
            logger.info(`Payment ${paymentRef} status updated to ${status}`);
        } catch (error) {
            logger.error('Error handling Konnect webhook:', error);
            throw error;
        }
    }

    async getPaymentDetails(paymentId: string) {
        try {
            const response = await axios.get(`${this.apiUrl}/payments/${paymentId}`, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.payment;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Payment not found');
            }
            if (error.response?.status === 401) {
                throw new Error('Invalid authentication');
            }
            logger.error('Error fetching payment details:', error);
            throw new Error(`Failed to fetch payment details: ${error.message}`);
        }
    }

    async pollPaymentStatus(paymentId: string, intervalMs = 5000, maxAttempts = 12): Promise<void> {
        let attempts = 0;
        const checkStatus = async () => {
            try {
                const paymentDetails = await this.getPaymentDetails(paymentId);
                if (paymentDetails.status === 'completed') {
                    // Payment successful
                    await this.updatePaymentStatus(paymentId, 'completed');
                    return;
                }
                if (attempts >= maxAttempts) {
                    // Timeout reached
                    await this.updatePaymentStatus(paymentId, 'failed');
                    throw new Error('Payment timeout');
                }
                attempts++;
                setTimeout(checkStatus, intervalMs);
            } catch (error) {
                logger.error('Error polling payment status:', error);
                throw error;
            }
        };
        await checkStatus();
    }

    private async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
        await KonnectPayment.findOneAndUpdate(
            { konnectPaymentId: paymentId },
            { status, updatedAt: new Date() }
        );
    }

    async confirmPayment(paymentId: string): Promise<IKonnectPayment> {
        try {
            const payment = await KonnectPayment.findOne({ konnectPaymentId: paymentId });
            if (!payment) {
                throw new Error('Payment not found');
            }

            const paymentDetails = await this.getPaymentDetails(paymentId);
            payment.status = paymentDetails.status.toLowerCase();
            payment.paymentDate = new Date();
            await payment.save();

            return payment;
        } catch (error) {
            logger.error('Error confirming payment:', error);
            throw error;
        }
    }

    async getPaymentById(paymentId: string): Promise<IKonnectPayment | null> {
        try {
            return await KonnectPayment.findOne({ konnectPaymentId: paymentId });
        } catch (error) {
            logger.error('Error getting payment by ID:', error);
            throw error;
        }
    }

    async getPaymentsByUser(userId: string): Promise<IKonnectPayment[]> {
        try {
            return await KonnectPayment.find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by user:', error);
            throw error;
        }
    }

    async getPaymentsByProperty(propertyId: string): Promise<IKonnectPayment[]> {
        try {
            return await KonnectPayment.find({ propertyId: new Types.ObjectId(propertyId) })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by property:', error);
            throw error;
        }
    }

    async getPaymentsByAgent(agentId: string): Promise<IKonnectPayment[]> {
        try {
            return await KonnectPayment.find({ agentId: new Types.ObjectId(agentId) })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting payments by agent:', error);
            throw error;
        }
    }
}