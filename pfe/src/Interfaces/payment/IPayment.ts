import { Document, Types } from 'mongoose';

export interface IPayment extends Document {
    _id: Types.ObjectId;
    transactionId: Types.ObjectId;
    amount: number;
    currency: string;
    method: 'credit_card' | 'bank_transfer' | 'paypal';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentDate: Date;
    paymentDetails: {
        cardLastFour?: string;
        bankName?: string;
        accountLastFour?: string;
        paypalEmail?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}