import { Document, Types } from 'mongoose';

export interface IMessage {
    _id?: Types.ObjectId;  // Add this line
    sender: Types.ObjectId;
    content: string;
    timestamp: Date;
    isRead: boolean;
    attachments?: string[];
}

export interface IChat extends Document {
    _id: Types.ObjectId;
    participants: Types.ObjectId[];
    propertyId: Types.ObjectId;
    messages: IMessage[];
    lastMessage: IMessage;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}