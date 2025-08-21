import { Document, Types } from 'mongoose';

export type ReviewTargetType = 'post' | 'property' | 'agent' | 'agency';

export interface IReview extends Document {
    _id: Types.ObjectId;
    rating: number;
    comment?: string;
    userId: Types.ObjectId;
    targetId: Types.ObjectId; // The ID of the reviewed entity
    targetType: ReviewTargetType; // The type of the reviewed entity
    createdAt: Date;
    updatedAt: Date;
}