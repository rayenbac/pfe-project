import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IFavorite } from '../Interfaces/favorite/IFavorite';

// Validation schema
export const FavoriteSchemaValidate = Joi.object({
    userId: Joi.string().required(),   // Keep as string for validation
    
    // Universal entity reference
    entityType: Joi.string().valid('agent', 'property', 'agency', 'post').optional(),
    entityId: Joi.string().optional(),
    
    // Backward compatibility
    name: Joi.string().optional(),
    properties: Joi.array().items(Joi.string()).optional(), // Keep as string array for validation
    agentId: Joi.string().optional(),
    agencyId: Joi.string().optional(),
    postId: Joi.string().optional(),
    
    notes: Joi.string().optional(),
});

// Favorite Schema
const favoriteSchema = new Schema<IFavorite>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // Universal entity reference
        entityType: { type: String, enum: ['agent', 'property', 'agency', 'post'] },
        entityId: { type: Schema.Types.ObjectId },
        
        // Backward compatibility
        name: { type: String },
        properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
        agentId: { type: Schema.Types.ObjectId, ref: 'User' },
        agencyId: { type: Schema.Types.ObjectId, ref: 'Agency' },
        postId: { type: Schema.Types.ObjectId, ref: 'Post' },
        
        notes: { type: String },
    },
    { timestamps: true }
);

export const Favorite = model<IFavorite>('Favorite', favoriteSchema);