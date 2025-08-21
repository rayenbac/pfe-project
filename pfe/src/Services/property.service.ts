import { injectable } from 'inversify';
import { Property } from '../Models/property';  // Ensure the path is correct
import { IPropertyRepository } from '../Interfaces/property/IPropertyRepository';
import { IProperty } from '../Interfaces/property/IProperty';
import "reflect-metadata";
import { Document } from 'mongoose';
import mongoose from 'mongoose';

@injectable()
class PropertyService implements IPropertyRepository {

    // Fetch all properties
    async getProperties(): Promise<(Document<unknown, any, IProperty> & IProperty)[]> {
        try {
            const properties = await Property.find({});
            return properties;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Fetch a single property by ID
    async getProperty(id: string): Promise<Document<unknown, any, IProperty> & IProperty | null> {
        try {
            const property = await Property.findById(id);
            if (!property) {
                return null;  // Or you can throw a custom error
            }
            return property;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Create a new property
    async createProperty(data: Omit<IProperty, '_id'>): Promise<Document<unknown, any, IProperty> & IProperty> {
        try {
            const newProperty = await Property.create(data);
            return newProperty;
        } catch (error) {
            console.log(error);
            throw new Error('Error creating property');  // You can customize error handling
        }
    }

    // Update a property
    async updateProperty(id: string, data: Partial<IProperty>): Promise<Document<unknown, any, IProperty> & IProperty | null> {
        try {
            const property = await Property.findByIdAndUpdate(id, data, { new: true });
            if (!property) {
                return null;  // Or you can throw a custom error
            }
            return property;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Delete a property by ID
    async deleteProperty(id: string): Promise<void> {
        try {
            const property = await Property.findByIdAndDelete(id);
            if (!property) {
                throw new Error('Property not found');
            }
        } catch (error) {
            console.log(error);
            throw new Error('Error deleting property');
        }
    }

    // Find properties by owner (user)
    async findPropertyByOwner(ownerId: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]> {
        try {
            const properties = await Property.find({ owner: ownerId });
            return properties;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find properties by location
    async findPropertyByLocation(location: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]> {
        try {
            const properties = await Property.find({ 
                $or: [
                    { 'address.city': { $regex: location, $options: 'i' } },
                    { 'address.state': { $regex: location, $options: 'i' } },
                    { 'address.country': { $regex: location, $options: 'i' } }
                ]
            });
            return properties;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find properties by type
    async findPropertyByType(type: string): Promise<(Document<unknown, any, IProperty> & IProperty)[]> {
        try {
            const properties = await Property.find({ type });
            return properties;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Search properties with criteria
    async searchProperties(criteria: any): Promise<(Document<unknown, any, IProperty> & IProperty)[]> {
        try {
            let query: any = {};

            // Build the query based on the criteria
            if (criteria.listingType) {
                query.listingType = criteria.listingType;
            }

            if (criteria.keyword) {
                query.$or = [
                    { title: { $regex: criteria.keyword, $options: 'i' } },
                    { description: { $regex: criteria.keyword, $options: 'i' } }
                ];
            }

            if (criteria.type) {
                query.type = criteria.type;
            }

            if (criteria.location) {
                query.$or = query.$or || [];
                query.$or.push(
                    { 'address.city': { $regex: criteria.location, $options: 'i' } },
                    { 'address.state': { $regex: criteria.location, $options: 'i' } },
                    { 'address.country': { $regex: criteria.location, $options: 'i' } }
                );
            }

            if (criteria.price) {
                query['pricing.price'] = {
                    $gte: criteria.price.min || 0,
                    $lte: criteria.price.max || Number.MAX_SAFE_INTEGER
                };
            }

            if (criteria.bedrooms) {
                query.bedrooms = criteria.bedrooms;
            }

            if (criteria.bathrooms) {
                query.bathrooms = criteria.bathrooms;
            }

            if (criteria.yearBuilt) {
                query.yearBuilt = criteria.yearBuilt;
            }

            if (criteria.amenities && criteria.amenities.length > 0) {
                query['amenities.name'] = { $in: criteria.amenities };
            }

            // Execute the query
            const properties = await Property.find(query);
            return properties;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Fetch a property by slug
    async getPropertyBySlug(titleSlug: string): Promise<Document<unknown, any, IProperty> & IProperty | null> {
        try {
            const properties = await Property.find({});
            const property = properties.find(p => {
                const propertySlug = p.title
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
                    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
                    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
                return propertySlug === titleSlug;
            });
            return property || null;
        } catch (error) {
            console.error('Error in getPropertyBySlug:', error);
            return null;
        }
    }

    // Get cities with property count
    async getCitiesWithPropertyCount(): Promise<{ city: string, count: number }[]> {
        try {
            const result = await Property.aggregate([
                { $group: { _id: "$address.city", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $project: { city: "$_id", count: 1, _id: 0 } }
            ]);
            return result;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Get similar properties based on matching criteria
    async getSimilarProperties(propertyId: string, limit: number = 5): Promise<Document<unknown, any, IProperty>[] | null> {
        try {
            console.log(`🔍 [PROPERTY SERVICE] getSimilarProperties called with ID: ${propertyId}, limit: ${limit}`);
            
            // First, get the current property to use its characteristics for matching
            const currentProperty = await Property.findById(propertyId);
            if (!currentProperty) {
                console.log(`❌ [PROPERTY SERVICE] Current property not found with ID: ${propertyId}`);
                return null;
            }

            console.log(`✅ [PROPERTY SERVICE] Current property found:`, {
                title: currentProperty.title,
                type: currentProperty.type,
                city: currentProperty.address?.city,
                price: currentProperty.pricing?.price,
                bedrooms: currentProperty.bedrooms,
                bathrooms: currentProperty.bathrooms,
                listingType: currentProperty.listingType
            });

            // Calculate price range (±20%)
            const priceMin = currentProperty.pricing.price * 0.8;
            const priceMax = currentProperty.pricing.price * 1.2;
            
            console.log(`💰 [PROPERTY SERVICE] Price range: ${priceMin} - ${priceMax}`);

            // Build similarity query with scoring
            const similarProperties = await Property.aggregate([
                // Exclude the current property
                { $match: { _id: { $ne: new mongoose.Types.ObjectId(propertyId) } } },
                
                // Add computed similarity score
                {
                    $addFields: {
                        similarityScore: {
                            $add: [
                                // Same city/location (3 points)
                                { $cond: [{ $eq: ["$address.city", currentProperty.address.city] }, 3, 0] },
                                
                                // Same property type (2 points)
                                { $cond: [{ $eq: ["$type", currentProperty.type] }, 2, 0] },
                                
                                // Same listing type (1 point)
                                { $cond: [{ $eq: ["$listingType", currentProperty.listingType] }, 1, 0] },
                                
                                // Price within range (2 points)
                                {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gte: ["$pricing.price", priceMin] },
                                                { $lte: ["$pricing.price", priceMax] }
                                            ]
                                        },
                                        2,
                                        0
                                    ]
                                },
                                
                                // Same number of bedrooms (1 point)
                                { $cond: [{ $eq: ["$bedrooms", currentProperty.bedrooms] }, 1, 0] },
                                
                                // Same number of bathrooms (1 point)
                                { $cond: [{ $eq: ["$bathrooms", currentProperty.bathrooms] }, 1, 0] }
                            ]
                        }
                    }
                },
                
                // Filter properties with at least some similarity (score > 0)
                { $match: { similarityScore: { $gt: 0 } } },
                
                // Sort by similarity score (desc) and then by creation date (desc for most recent)
                { $sort: { similarityScore: -1, createdAt: -1 } },
                
                // Limit results
                { $limit: limit },
                
                // Remove the computed field from final output
                { $project: { similarityScore: 0 } }
            ]);

            console.log(`📊 [PROPERTY SERVICE] Aggregation returned ${similarProperties.length} similar properties`);
            
            if (similarProperties.length > 0) {
                console.log(`🏠 [PROPERTY SERVICE] Similar properties found:`, 
                    similarProperties.map(p => ({
                        id: p._id,
                        title: p.title,
                        type: p.type,
                        city: p.address?.city,
                        price: p.pricing?.price
                    }))
                );
            } else {
                console.log(`⚠️ [PROPERTY SERVICE] No similar properties found for criteria`);
                
                // Let's check if there are any other properties in the database
                const totalCount = await Property.countDocuments({ _id: { $ne: new mongoose.Types.ObjectId(propertyId) } });
                console.log(`📈 [PROPERTY SERVICE] Total other properties in DB: ${totalCount}`);
            }

            return similarProperties;
        } catch (error) {
            console.error('❌ [PROPERTY SERVICE] Error in getSimilarProperties:', error);
            return null;
        }
    }
}

export { PropertyService };