import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IPayment } from '../Interfaces/payment/IPayment';

export const PaymentSchemaValidate = Joi.object({
    transactionId: Joi.string().required(),
    amount: Joi.number().required().min(0),
    currency: Joi.string().required(),
    method: Joi.string().valid('credit_card', 'bank_transfer', 'paypal').required(),
    paymentDetails: Joi.object({
        cardLastFour: Joi.string(),
        bankName: Joi.string(),
        accountLastFour: Joi.string(),
        paypalEmail: Joi.string().email()
    }).required(),
});

const paymentSchema = new Schema<IPayment>(
    {
        transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        method: { 
            type: String, 
            enum: ['credit_card', 'bank_transfer', 'paypal'], 
            required: true 
        },
        status: { 
            type: String, 
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentDate: { type: Date },
        paymentDetails: {
            cardLastFour: String,
            bankName: String,
            accountLastFour: String,
            paypalEmail: String
        }
    },
    { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);