import { IPayment } from './IPayment';
import { Document } from 'mongoose';

export interface IPaymentRepository {
    getPayments(): Promise<(Document<unknown, any, IPayment> & IPayment)[]>;
    getPayment(id: string): Promise<Document<unknown, any, IPayment> & IPayment | null>;
    processPayment(data: Omit<IPayment, '_id'>): Promise<Document<unknown, any, IPayment> & IPayment>;
    updatePaymentStatus(id: string, status: 'completed' | 'failed' | 'refunded'): Promise<Document<unknown, any, IPayment> & IPayment | null>;
    getPaymentsByTransaction(transactionId: string): Promise<(Document<unknown, any, IPayment> & IPayment)[]>;
    processRefund(id: string): Promise<Document<unknown, any, IPayment> & IPayment | null>;
}
