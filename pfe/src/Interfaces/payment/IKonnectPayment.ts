import { Document, Types } from 'mongoose';

export interface IKonnectPayment extends Document {
    propertyId: Types.ObjectId;
    userId: Types.ObjectId;
    agentId: Types.ObjectId;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    konnectPaymentId: string;
    paymentDate?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IKonnectPaymentRepository {
    createPayment(data: {
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
    }): Promise<{ paymentUrl: string; paymentId: string }>;
    confirmPayment(paymentId: string): Promise<IKonnectPayment>;
    getPaymentById(paymentId: string): Promise<IKonnectPayment | null>;
    getPaymentsByUser(userId: string): Promise<IKonnectPayment[]>;
    getPaymentsByProperty(propertyId: string): Promise<IKonnectPayment[]>;
    getPaymentsByAgent(agentId: string): Promise<IKonnectPayment[]>;
}