import express from 'express';
import { PaymentController } from '../Controllers/payment.controller';
import { diContainer } from '../DI/iversify.config';
import { PaymentTYPES } from '../DI/Payment/PaymentTypes';

export const router = express.Router();

const controller = diContainer.get<PaymentController>(PaymentTYPES.paymentController);

router.get('/', controller.getPayments);
router.get('/:id', controller.getPayment);
router.post('/', controller.processPayment);
router.put('/:id/status', controller.updatePaymentStatus);
router.post('/:id/refund', controller.processRefund);
router.get('/transaction/:transactionId', controller.getPaymentsByTransaction);

export default router;