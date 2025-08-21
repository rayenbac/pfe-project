import { Document } from 'mongoose';

export interface ICategory extends Document {
    id: string;
    name: string;              // The name of the category
    description?: string;      // The description of the category (optional)
    properties: string[];      // List of property IDs (References to Property)
    createdAt?: Date;          // Auto-generated created timestamp
    updatedAt?: Date;          // Auto-generated updated timestamp
}
