import { Types } from 'mongoose';

export interface IBooking {
    _id?: string | Types.ObjectId;
    property: string | Types.ObjectId;
    tenant: string | Types.ObjectId;
    owner: string | Types.ObjectId;
    startDate: Date;
    endDate: Date;
    guestCount: number;
    totalAmount: number;
    extraGuestSurcharge: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    reservationType: 'online' | 'offline';
    paymentDeadline?: Date;
    specialRequests?: string;
    contactInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        cinPassportNumber?: string;
        address?: string;
    };
    metadata?: {
        rentalDays?: number;
        pricePerDay?: number;
        stripeSessionId?: string;
        konnectPaymentId?: string;
        propertyTitle?: string;
        originalAmount?: number;
        convertedAmount?: number;
        originalCurrency?: string;
        paymentCurrency?: string;
        contractId?: string;
        contractGenerated?: boolean;
        contractSentToEmail?: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
