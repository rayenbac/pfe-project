import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IChat, IMessage } from '../Interfaces/chat/IChat';

export const MessageSchemaValidate = Joi.object({
    sender: Joi.string().required(),
    content: Joi.string().required(),
    attachments: Joi.array().items(Joi.string().uri()).optional()
});

export const ChatSchemaValidate = Joi.object({
    participants: Joi.array().items(Joi.string()).min(2).max(2).required(),
    propertyId: Joi.string().required(),
    message: MessageSchemaValidate
});

const messageSchema = new Schema<IMessage>({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    attachments: [{ type: String }]
});

const chatSchema = new Schema<IChat>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: false },
        messages: [messageSchema],
        lastMessage: { type: messageSchema },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ propertyId: 1 });
chatSchema.index({ 'messages.timestamp': -1 });

export const Chat = model<IChat>('Chat', chatSchema);