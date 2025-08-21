export interface Review {
    id?: string; // Optional, as MongoDB generates it (_id)
    _id?: string; // MongoDB ObjectId
    rating: number; // Between 1 and 5
    comment?: string; // Optional
    reviewerName?: string; // Name of the reviewer (for display)
    reviewerEmail?: string; // Email of the reviewer (optional)
    userId?: string; // Reference to User (if logged in user)
    
    // Universal entity reference (backend uses targetType/targetId)
    entityType?: 'agent' | 'property' | 'agency' | 'post'; // Type of entity being reviewed (frontend)
    entityId?: string; // ID of the entity being reviewed (frontend)
    
    // Backend fields (what the API expects)
    targetType?: 'agent' | 'property' | 'agency' | 'post'; // Type of entity being reviewed (backend)
    targetId?: string; // ID of the entity being reviewed (backend)
    
    // Backward compatibility (deprecated, use entityId/targetId instead)
    propertyId?: string; // Reference to Property
    agentId?: string; // Reference to Agent
    agencyId?: string; // Reference to Agency
    postId?: string; // Reference to Post
    
    // Populated property information for templates
    property?: {
        _id: string;
        title: string;
        images: string[];
        address?: string;
    };
    
    isVerified?: boolean; // If the review is verified
    helpfulCount?: number; // Number of users who found this review helpful
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateReviewRequest {
    rating: number;
    comment?: string;
    entityType: 'agent' | 'property' | 'agency' | 'post';
    entityId: string;
    propertyId?: string; // For backward compatibility
}
  