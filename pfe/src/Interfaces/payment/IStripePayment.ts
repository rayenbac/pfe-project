import { Document, Types } from 'mongoose';

export interface IStripePayment extends Document {
    _id: Types.ObjectId;
    transactionId: Types.ObjectId;
    propertyId: Types.ObjectId;
    userId: Types.ObjectId;
    agentId: Types.ObjectId;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    stripePaymentIntentId: string;
    stripeCustomerId?: string;
    stripeConnectAccountId?: string;
    paymentDate?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IStripePaymentRepository {
    createPaymentIntent(data: {
        amount: number;
        currency: string;
        propertyId: string;
        userId: string;
        agentId: string;
        metadata?: Record<string, any>;
    }): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    
    confirmPayment(paymentIntentId: string): Promise<IStripePayment>;
    
    getPaymentByIntentId(paymentIntentId: string): Promise<IStripePayment | null>;
    
    getPaymentsByUser(userId: string): Promise<IStripePayment[]>;
    
    getPaymentsByProperty(propertyId: string): Promise<IStripePayment[]>;
    
    getPaymentsByAgent(agentId: string): Promise<IStripePayment[]>;
    
    refundPayment(paymentIntentId: string, amount?: number): Promise<IStripePayment>;
}