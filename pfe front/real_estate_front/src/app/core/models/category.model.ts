export interface Category {
    _id?: string; // Optional, since MongoDB auto-generates it
    name: string;
    description?: string;
    properties?: string[]; // Array of Property IDs (referencing Property model)
    createdAt?: Date;
    updatedAt?: Date;
  }