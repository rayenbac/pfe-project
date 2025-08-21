import { Document, Types } from 'mongoose';

export type NotificationType = 
    | 'payment_received'
    | 'payment_failed'
    | 'payment_confirmed'
    | 'new_message'
    | 'property_viewed'
    | 'offer_received'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'viewing_scheduled'
    | 'viewing_reminder'
    | 'document_required'
    | 'property_status_update'
    | 'booking_confirmed'
    | 'new_booking'
    | 'favorite_property_updated'
    | 'property_reviewed'
    | 'post_commented'
    | 'post_reviewed'
    | 'admin_new_property'
    | 'admin_property_updated'
    | 'admin_report_received';

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedId?: Types.ObjectId | string; // Can be ObjectId or string (for slugs)
    relatedType?: 'property' | 'transaction' | 'message' | 'payment' | 'viewing' | 'booking' | 'post' | 'review' | 'agency' | 'agent';
    scheduledFor?: Date; // For reminders
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    updatedAt: Date;
}