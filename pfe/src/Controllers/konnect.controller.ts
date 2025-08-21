import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { KonnectService } from '../Services/konnect.service';
import { logger } from '../Config/logger.config';
import { KonnectPaymentSchemaValidate } from '../Models/konnectPayment';

@injectable()
class KonnectController {
    private service: KonnectService;

    constructor(@inject(Symbol.for("KonnectService")) service: KonnectService) {
        this.service = service;
    }

    createPayment = async (req: Request, res: Response) => {
        try {
            console.log('Konnect payment request received:', JSON.stringify(req.body, null, 2));
            
            const { error, value } = KonnectPaymentSchemaValidate.validate(req.body);
            if (error) {
                console.error('Konnect validation error:', error.message);
                console.error('Request body:', req.body);
                return res.status(400).json({ 
                    message: error.message,
                    details: error.details,
                    receivedData: req.body
                });
            }

            const { 
                propertyId, 
                userId, 
                agentId, 
                amount,
                currency,
                userEmail,
                firstName,
                lastName,
                phoneNumber,
                metadata 
            } = value;

            console.log('Validated Konnect payment data:', {
                propertyId,
                userId,
                agentId,
                amount,
                currency,
                userEmail,
                firstName,
                lastName,
                phoneNumber
            });

            const result = await this.service.createPayment({
                propertyId,
                userId,
                agentId,
                amount,
                currency,
                userEmail,
                firstName,
                lastName,
                phoneNumber,
                metadata
            });

            console.log('Konnect payment created successfully:', result);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('Error creating Konnect payment:', error);
            logger.error('Error creating payment:', error);
            res.status(500).json({ message: error.message });
        }
    }

    handleWebhook = async (req: Request, res: Response) => {
        try {
            // Log the full request details
            logger.info('Webhook request received:', {
                method: req.method,
                query: req.query,
                body: req.body,
                headers: req.headers
            });

            // Get payment reference from either query params or body
            const paymentRef = req.query.payment_ref || req.body.payment_ref;
            logger.info(`Extracted paymentRef: ${paymentRef}`);
            
            if (!paymentRef) {
                logger.error('No payment reference found in webhook');
                if (req.method === 'GET') {
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=No+payment+reference+found`);
                }
                return res.status(400).json({ message: 'Payment reference is required' });
            }

            // Get payment details from Konnect
            let paymentDetails;
            try {
                paymentDetails = await this.service.getPaymentDetails(paymentRef as string);
                logger.info(`Payment details from Konnect:`, paymentDetails);
            } catch (err) {
                logger.error('Error fetching payment details from Konnect:', err);
                if (req.method === 'GET') {
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=Failed+to+fetch+payment+details`);
                }
                return res.status(500).json({ message: 'Failed to fetch payment details', error: err instanceof Error ? err.message : err });
            }
            
            // Handle the webhook
            try {
                await this.service.handleWebhook({
                    paymentRef: paymentRef,
                    status: paymentDetails.status
                });
                logger.info(`Webhook handled for paymentRef: ${paymentRef}, status: ${paymentDetails.status}`);
            } catch (err) {
                logger.error('Error handling webhook business logic:', err);
                if (req.method === 'GET') {
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=Webhook+business+logic+error`);
                }
                return res.status(500).json({ message: 'Webhook business logic error', error: err instanceof Error ? err.message : err });
            }

            // Redirect to success or failure page based on payment status
            if (req.method === 'GET') {
                // Check if payment is completed/successful
                if (paymentDetails.status && paymentDetails.status.toLowerCase() === 'completed') {
                    logger.info(`Redirecting to success page for paymentRef: ${paymentRef}`);
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/success?ref=${paymentRef}`);
                } 
                // Check if payment is explicitly failed
                else if (paymentDetails.status && ['failed', 'cancelled', 'rejected'].includes(paymentDetails.status.toLowerCase())) {
                    logger.info(`Redirecting to failure page for paymentRef: ${paymentRef}, status: ${paymentDetails.status}`);
                    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?ref=${paymentRef}&status=${paymentDetails.status}`);
                }
                // Check if all transactions failed (even if status is pending)
                else if (paymentDetails.failedTransactions > 0 && paymentDetails.successfulTransactions === 0 && paymentDetails.transactions) {
                    const allTransactionsFailed = paymentDetails.transactions.every((tx: any) => 
                        tx.status === 'failed_payment' || tx.status === 'failed'
                    );
                    if (allTransactionsFailed) {
                        logger.info(`All transactions failed for paymentRef: ${paymentRef}, redirecting to failure page`);
                        return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?ref=${paymentRef}&status=failed&reason=all_transactions_failed`);
                    }
                }
                
                // For pending, processing, or other intermediate states, don't redirect
                // Let the user stay on the payment page or return a waiting response
                logger.info(`Payment still in progress for paymentRef: ${paymentRef}, status: ${paymentDetails.status}`);
                return res.status(200).json({
                    message: 'Payment is being processed',
                    paymentRef: paymentRef,
                    status: paymentDetails.status,
                    action: 'continue_waiting'
                });
            }

            // Return JSON response for POST requests
            res.status(200).json({ 
                message: 'Webhook processed successfully',
                paymentRef: paymentRef,
                status: paymentDetails.status
            });
        } catch (error: any) {
            logger.error('Error processing webhook:', error);
            logger.error(error?.stack);
            // Redirect to failure page if it's a GET request
            if (req.method === 'GET') {
                return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=${encodeURIComponent(error.message || 'Unknown error')}`);
            }
            // Return JSON error for POST requests
            res.status(200).json({ 
                message: 'Webhook received with errors',
                error: error.message
            });
        }
    }

    // Test endpoint to simulate successful payment for development
    simulateSuccessfulPayment = async (req: Request, res: Response) => {
        try {
            const { paymentRef } = req.body;
            
            if (!paymentRef) {
                return res.status(400).json({ message: 'Payment reference is required' });
            }

            // Simulate successful payment webhook
            await this.service.handleWebhook({
                paymentRef: paymentRef,
                status: 'completed'
            });

            logger.info(`Simulated successful payment for paymentRef: ${paymentRef}`);
            res.status(200).json({ 
                message: 'Payment successfully simulated',
                paymentRef: paymentRef,
                status: 'completed'
            });
        } catch (error: any) {
            logger.error('Error simulating payment:', error);
            res.status(500).json({ message: error.message });
        }
    }

    getPaymentDetails = async (req: Request, res: Response) => {
        try {
            const { paymentId } = req.params;
            
            if (!paymentId) {
                return res.status(400).json({ message: 'Payment ID is required' });
            }

            const payment = await this.service.getPaymentById(paymentId);
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }

            // Get latest status from Konnect
            const konnectPaymentDetails = await this.service.getPaymentDetails(paymentId);
            
            // Merge local payment data with Konnect status
            const paymentDetails = {
                ...payment.toObject(),
                konnectStatus: konnectPaymentDetails.status
            };

            res.status(200).json(paymentDetails);
        } catch (error: any) {
            logger.error('Error getting payment details:', error);
            res.status(500).json({ message: error.message });
        }
    }
}

export { KonnectController };