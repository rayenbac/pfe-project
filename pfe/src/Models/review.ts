import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IReview } from '../Interfaces/review/IReview';

// Validation schema for the review
export const ReviewSchemaValidate = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().optional(),
    userId: Joi.string().required(),
    targetId: Joi.string().required(),
    targetType: Joi.string().valid('post', 'property', 'agent', 'agency').required(),
});

// Review Schema
const reviewSchema = new Schema<IReview>(
    {
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        targetType: { type: String, enum: ['post', 'property', 'agent', 'agency'], required: true },
    },
    { timestamps: true }
);

export const Review = model<IReview>('Review', reviewSchema);