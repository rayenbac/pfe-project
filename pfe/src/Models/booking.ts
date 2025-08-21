import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IBooking } from '../Interfaces/booking/IBooking';

// Validation schema
export const BookingSchemaValidate = Joi.object({
    property: Joi.string().required(),
    tenant: Joi.string().required(),
    owner: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    guestCount: Joi.number().min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    extraGuestSurcharge: Joi.number().min(0).default(0),
    currency: Joi.string().required(),
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed').default('pending'),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded').default('pending'),
    reservationType: Joi.string().valid('online', 'offline').default('online'),
    paymentDeadline: Joi.date().when('reservationType', {
        is: 'offline',
        then: Joi.date().required(),
        otherwise: Joi.date().optional()
    }),
    specialRequests: Joi.string().allow(''),
    contactInfo: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        cinPassportNumber: Joi.string().allow(''),
        address: Joi.string().allow('')
    }).required(),
    metadata: Joi.object({
        rentalDays: Joi.number().min(1),
        pricePerDay: Joi.number().min(0),
        stripeSessionId: Joi.string().allow(''),
        konnectPaymentId: Joi.string().allow(''),
        propertyTitle: Joi.string().allow(''),
        originalAmount: Joi.number().min(0),
        convertedAmount: Joi.number().min(0),
        originalCurrency: Joi.string().allow(''),
        paymentCurrency: Joi.string().allow(''),
        contractId: Joi.string().allow(''),
        contractGenerated: Joi.boolean().default(false),
        contractSentToEmail: Joi.boolean().default(false)
    })
});

// Booking Schema
const bookingSchema = new Schema<IBooking>(
    {
        property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
        tenant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        guestCount: { type: Number, required: true, min: 1 },
        totalAmount: { type: Number, required: true, min: 0 },
        extraGuestSurcharge: { type: Number, default: 0, min: 0 },
        currency: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        reservationType: {
            type: String,
            enum: ['online', 'offline'],
            default: 'online'
        },
        paymentDeadline: {
            type: Date
        },
        specialRequests: { type: String, default: '' },
        contactInfo: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            cinPassportNumber: { type: String },
            address: { type: String }
        },
        metadata: {
            rentalDays: { type: Number },
            pricePerDay: { type: Number },
            stripeSessionId: { type: String },
            konnectPaymentId: { type: String },
            propertyTitle: { type: String },
            originalAmount: { type: Number },
            convertedAmount: { type: Number },
            originalCurrency: { type: String },
            paymentCurrency: { type: String },
            contractId: { type: String },
            contractGenerated: { type: Boolean, default: false },
            contractSentToEmail: { type: Boolean, default: false }
        }
    },
    { timestamps: true }
);

// Indexes for better query performance
bookingSchema.index({ property: 1 });
bookingSchema.index({ tenant: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Compound index for availability checks
bookingSchema.index({ property: 1, startDate: 1, endDate: 1, status: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
