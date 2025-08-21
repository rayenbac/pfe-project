import { Schema, model } from 'mongoose';
import Joi from 'joi';
import { IKonnectPayment } from '../Interfaces/payment/IKonnectPayment';

export const KonnectPaymentSchemaValidate = Joi.object({
    propertyId: Joi.string().required(),
    userId: Joi.string().required(),
    agentId: Joi.string().required(),
    amount: Joi.number().required().min(0),
    currency: Joi.string().optional().default('TND'),
    userEmail: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    konnectPaymentId: Joi.string().optional(),
    metadata: Joi.object().optional()
});

const konnectPaymentSchema = new Schema<IKonnectPayment>(
    {
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true, default: 'TND' },
        status: { 
            type: String, 
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        konnectPaymentId: { type: String, required: true },
        paymentDate: { type: Date },
        metadata: { type: Object }
    },
    { timestamps: true }
);

// Indexes for better query performance
konnectPaymentSchema.index({ userId: 1 });
konnectPaymentSchema.index({ propertyId: 1 });
konnectPaymentSchema.index({ agentId: 1 });
konnectPaymentSchema.index({ konnectPaymentId: 1 }, { unique: true });
konnectPaymentSchema.index({ status: 1 });

export const KonnectPayment = model<IKonnectPayment>('KonnectPayment', konnectPaymentSchema);