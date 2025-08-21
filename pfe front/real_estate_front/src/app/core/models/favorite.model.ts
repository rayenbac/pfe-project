export interface Favorite {
    id?: string; // Optional, since MongoDB generates it
    userId: string; // User ID
    
    // Universal entity reference - only one should be filled
    entityType: 'agent' | 'property' | 'agency' | 'post'; // Type of entity being favorited
    entityId: string; // ID of the entity being favorited
    
    // Backward compatibility (deprecated, use entityId instead)
    properties?: string[]; // Array of Property IDs
    agentId?: string; // Reference to Agent
    agencyId?: string; // Reference to Agency
    postId?: string; // Reference to Post
    
    name?: string; // Custom name for the favorite (for collections)
    notes?: string; // Optional notes about why this was favorited
    createdAt?: Date;
    updatedAt?: Date;
}
  