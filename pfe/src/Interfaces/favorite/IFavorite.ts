import { Document, Types } from 'mongoose';

export interface IFavorite extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;           // Changed to ObjectId
    
    // Universal entity reference - only one should be filled
    entityType?: 'agent' | 'property' | 'agency' | 'post'; // Type of entity being favorited
    entityId?: Types.ObjectId; // ID of the entity being favorited
    
    // Backward compatibility (deprecated, use entityId instead)
    name?: string;
    properties?: Types.ObjectId[];     // Changed to array of ObjectId
    agentId?: Types.ObjectId; // Reference to Agent
    agencyId?: Types.ObjectId; // Reference to Agency
    postId?: Types.ObjectId; // Reference to Post
    
    notes?: string; // Optional notes about why this was favorited
    createdAt: Date;
    updatedAt: Date;
}