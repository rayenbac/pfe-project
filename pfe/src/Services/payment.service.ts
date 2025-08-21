import { injectable } from 'inversify';
import { Payment } from '../Models/payment';
import { IPayment } from '../Interfaces/payment/IPayment';
import "reflect-metadata";
import { Document, Types } from 'mongoose';
import { IPaymentRepository } from '../Interfaces/payment/IPaymentRepository';

@injectable()
class PaymentService  implements IPaymentRepository{
    // Get all payments
    async getPayments() {
        try {
            const payments = await Payment.find({}).populate('transactionId');
            return payments;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Get a single payment
    async getPayment(id: string) {
        try {
            const payment = await Payment.findById(id).populate('transactionId');
            if (!payment) {
                return null;
            }
            return payment;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Process a new payment
    async processPayment(data: Omit<IPayment, '_id'>) {
        try {
            const payment = await Payment.create({
                ...data,
                paymentDate: new Date(),
                status: 'pending'
            });
            return payment;
        } catch (error) {
            console.log(error);
            throw new Error('Error processing payment');
        }
    }

    // Update payment status
    async updatePaymentStatus(id: string, status: 'completed' | 'failed' | 'refunded') {
        try {
            const payment = await Payment.findByIdAndUpdate(
                id,
                { status, ...(status === 'completed' ? { paymentDate: new Date() } : {}) },
                { new: true }
            ).populate({
                path: 'transactionId',
                populate: {
                    path: 'buyer',
                    select: '_id firstName lastName email'
                }
            });
            return payment;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Get payments by transaction
    async getPaymentsByTransaction(transactionId: string) {
        try {
            const payments = await Payment.find({ transactionId });
            return payments;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Process refund
    async processRefund(id: string) {
        try {
            const payment = await Payment.findById(id);
            if (!payment || payment.status !== 'completed') {
                throw new Error('Payment not found or not eligible for refund');
            }
            return await this.updatePaymentStatus(id, 'refunded');
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export { PaymentService };