import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IStripePayment } from '../Interfaces/payment/IStripePayment';

export const StripePaymentSchemaValidate = Joi.object({
    transactionId: Joi.string().optional(),
    propertyId: Joi.string().required(),
    userId: Joi.string().required(),
    agentId: Joi.string().required(),
    amount: Joi.number().required().min(0),
    currency: Joi.string().required().default('usd'),
    stripePaymentIntentId: Joi.string().optional(),
    stripeCustomerId: Joi.string().optional(),
    stripeConnectAccountId: Joi.string().optional(),
    metadata: Joi.object().optional()
});

const stripePaymentSchema = new Schema<IStripePayment>(
    {
        transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: false },
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'usd' },
        status: { 
            type: String, 
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        stripePaymentIntentId: { type: String, required: true },
        stripeCustomerId: { type: String },
        stripeConnectAccountId: { type: String },
        paymentDate: { type: Date },
        metadata: { type: Object }
    },
    { timestamps: true }
);

// Indexes for better query performance
stripePaymentSchema.index({ userId: 1 });
stripePaymentSchema.index({ propertyId: 1 });
stripePaymentSchema.index({ agentId: 1 });
stripePaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
stripePaymentSchema.index({ status: 1 });

export const StripePayment = model<IStripePayment>('StripePayment', stripePaymentSchema);