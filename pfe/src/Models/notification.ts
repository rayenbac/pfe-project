import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { INotification, NotificationType } from '../Interfaces/notification/INotification';

export const NotificationSchemaValidate = Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    relatedId: Joi.string().optional(),
    relatedType: Joi.string().valid('property', 'transaction', 'message', 'payment', 'viewing', 'booking', 'post', 'review', 'agency', 'agent').optional(),
    scheduledFor: Joi.date().optional(),
    priority: Joi.string().valid('low', 'medium', 'high').required()
});

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        relatedId: { type: Schema.Types.Mixed }, // Mixed type to handle both ObjectId and string (for slugs)
        relatedType: { 
            type: String,
            enum: ['property', 'transaction', 'message', 'payment', 'viewing', 'booking', 'post', 'review', 'agency', 'agent']
        },
        scheduledFor: { type: Date },
        priority: { 
            type: String, 
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },
    { timestamps: true }
);

export const Notification = model<INotification>('Notification', notificationSchema);