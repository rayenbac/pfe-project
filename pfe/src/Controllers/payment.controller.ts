import { PaymentService } from '../Services/payment.service';
import { injectable, inject } from 'inversify';
import { PaymentTYPES } from "../DI/Payment/PaymentTypes";
import { Request, Response } from 'express';
import { PaymentSchemaValidate } from '../Models/payment';
import { realtimeNotificationService } from '../Server/app';

@injectable()
class PaymentController {
    private service: PaymentService;

    constructor(@inject(PaymentTYPES.paymentService) service: PaymentService) {
        this.service = service;
    }

    // Get all payments
    getPayments = async (req: Request, res: Response) => {
        const payments = await this.service.getPayments();
        res.status(200).send(payments);
    }

    // Get a single payment
    getPayment = async (req: Request, res: Response) => {
        const id = req.params.id;
        const payment = await this.service.getPayment(id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).send(payment);
    }

    // Process a new payment
    processPayment = async (req: Request, res: Response) => {
        const { error, value } = PaymentSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        try {
            const payment = await this.service.processPayment(value);
            res.status(201).send(payment);
        } catch (error) {
            res.status(500).json({ message: 'Error processing payment' });
        }
    }

    // Update payment status
    updatePaymentStatus = async (req: Request, res: Response) => {
        const id = req.params.id;
        const { status } = req.body;
        
        if (!['completed', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const payment = await this.service.updatePaymentStatus(id, status);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Send notification for successful payment
        if (status === 'completed' && payment.transactionId && realtimeNotificationService) {
            try {
                const transaction = payment.transactionId as any;
                if (transaction && transaction.buyer && transaction.buyer._id) {
                    await realtimeNotificationService.notifyPaymentConfirmed(
                        transaction.buyer._id.toString(),
                        {
                            paymentId: payment._id.toString(),
                            amount: payment.amount,
                            status: status
                        }
                    );
                }
            } catch (error) {
                console.error('Error sending payment notification:', error);
            }
        }

        res.status(200).send(payment);
    }

    // Process refund
    processRefund = async (req: Request, res: Response) => {
        const id = req.params.id;
        try {
            const refund = await this.service.processRefund(id);
            res.status(200).send(refund);
        } catch (error) {
            res.status(400).json({ message: 'Error processing refund' });
        }
    }

    // Get payments by transaction
    getPaymentsByTransaction = async (req: Request, res: Response) => {
        const transactionId = req.params.transactionId;
        const payments = await this.service.getPaymentsByTransaction(transactionId);
        res.status(200).send(payments);
    }
}

export { PaymentController };