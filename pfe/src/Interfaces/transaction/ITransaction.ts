import { Document, Types } from 'mongoose';

export interface ITransaction extends Document {
    _id: Types.ObjectId;
    buyer: Types.ObjectId;      // Changed to ObjectId
    seller: Types.ObjectId;     // Changed to ObjectId
    property: Types.ObjectId;   // Changed to ObjectId
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
}