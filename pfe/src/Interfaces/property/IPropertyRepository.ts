import { IProperty } from './IProperty';
import { Document } from 'mongoose';

export interface IPropertyRepository {
    getProperties(): Promise<(Document<unknown, any, IProperty> & IProperty)[]>; // Get all properties
    getProperty(id: string): Promise<Document<unknown, any, IProperty> & IProperty | null>; // Get a single property by ID
    createProperty(data: Omit<IProperty, '_id'>): Promise<Document<unknown, any, IProperty> & IProperty>; // Create a new property
    updateProperty(id: string, data: Partial<IProperty>): Promise<Document<unknown, any, IProperty> & IProperty | null>; // Update a property
    deleteProperty(id: string): Promise<void>; // Delete a property
    findPropertyByOwner(ownerId: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]>; // Find properties by owner (user)
    findPropertyByLocation(location: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]>; // Find properties by location
    findPropertyByType(type: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]>; // Find properties by type
    searchProperties(criteria: any): Promise<(Document<unknown, any, IProperty> & IProperty)[]>; // Search properties with criteria
}