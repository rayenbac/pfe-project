import { injectable } from 'inversify';
import { Favorite } from '../Models/favorite';  // Assuming you have a Favorite model
import { IFavoriteRepository } from '../Interfaces/favorite/IFavoriteRepository';
import { IFavorite } from '../Interfaces/favorite/IFavorite';
import "reflect-metadata";
import { Document, Types } from 'mongoose';
import { UserService } from './user.service';
import { isValidObjectId } from 'mongoose';

@injectable()
class FavoriteService implements IFavoriteRepository {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    // Fetch all favorites
    async getFavorites() {
        try {
            const favorites = await Favorite.find({});
            return favorites;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Fetch a single favorite by ID
    async getFavorite(id: string): Promise<(Document<unknown, any, IFavorite> & IFavorite) | null> {
        try {
            const favorite = await Favorite.findById({ _id: id });
            if (!favorite) {
                return null;  // Or you can throw a custom error
            }
            return favorite;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Create a new favorite
    async createFavorite(data: Omit<IFavorite, '_id'>): Promise<Document<unknown, any, IFavorite> & IFavorite> {
        try {
            // Get the user's full name for the favorite list name
            const user = await this.userService.getUser(data.userId.toString());
            let userName = 'Favorites';
            if (user && user !== '404') {
                userName = `${user.firstName} ${user.lastName}`;
            }
            // Check if a favorite list already exists for this user
            const existingFavorite = await Favorite.findOne({ 
                userId: data.userId, 
                name: userName
            });
            if (existingFavorite) {
                // If the property is not already in the list, add it
                if (data.properties && data.properties.length > 0) {
                    const propertyId = data.properties[0];
                    const propertyObjectId = new Types.ObjectId(propertyId);
                    
                    // Initialize properties array if it doesn't exist
                    if (!existingFavorite.properties) {
                        existingFavorite.properties = [];
                    }
                    
                    if (!existingFavorite.properties.some(id => id.equals(propertyObjectId))) {
                        existingFavorite.properties.push(propertyObjectId);
                        await existingFavorite.save();
                    }
                }
                return existingFavorite;
            }
            // Create a new favorite list with the user's name
            const newFavorite = await Favorite.create({
                userId: data.userId,
                name: userName,
                properties: data.properties || []
            });
            return newFavorite;
        } catch (error) {
            console.log(error);
            throw new Error('Error creating favorite');
        }
    }

    // Update a favorite
    async updateFavorite(id: string, data: Partial<IFavorite>): Promise<(Document<unknown, any, IFavorite> & IFavorite) | null> {
        try {
            const favorite = await Favorite.findByIdAndUpdate({ _id: id }, data, { new: true });
            if (!favorite) {
                return null;  // Or you can throw a custom error
            }
            return favorite;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Delete a favorite by ID
    async deleteFavorite(id: string): Promise<void> {
        try {
            const favorite = await Favorite.findByIdAndDelete(id);
            if (!favorite) {
                throw new Error('Favorite not found');
            }
        } catch (error) {
            console.log(error);
            throw new Error('Error deleting favorite');
        }
    }

    // Add a property to an existing favorite (push to array, not replace)
    async addPropertyToFavorite(id: string, property: any): Promise<(Document<unknown, any, IFavorite> & IFavorite) | null> {
        try {
            const favorite = await Favorite.findById(id);
            if (!favorite) {
                return null;
            }
            // Only add if not already present
            const propertyId = property.propertyId || property._id || property;
            const propertyObjectId = new Types.ObjectId(propertyId);
            
            // Initialize properties array if it doesn't exist
            if (!favorite.properties) {
                favorite.properties = [];
            }
            
            if (!favorite.properties.some(id => id.equals(propertyObjectId))) {
                favorite.properties.push(propertyObjectId);
                await favorite.save();
            }
            return favorite;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Find all favorites by a specific user
    async findFavoriteByUser(userId: string) {
        try {
            const favorites = await Favorite.find({ userId: userId });
            return favorites;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find favorites by name
    async findFavoriteByName(name: string) {
        try {
            const favorites = await Favorite.find({ name: { $regex: name, $options: 'i' } }); // Case-insensitive search
            return favorites;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
    
    // Check if a property is in user's favorites
    async checkPropertyInFavorites(userId: string, propertyId: string): Promise<boolean> {
        try {
            if (!isValidObjectId(propertyId)) {
                console.log('propertyId non valide pour ObjectId:', propertyId);
                return false;
            }
            const propertyObjectId = new Types.ObjectId(propertyId);
            const favorite = await Favorite.findOne({
                userId: userId,
                properties: propertyObjectId
            });
            return !!favorite;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    // Add a property to user's favorites
    async addPropertyToFavorites(userId: string, propertyId: string): Promise<Document<unknown, any, IFavorite> & IFavorite> {
        try {
            if (!isValidObjectId(propertyId)) {
                throw new Error('propertyId non valide pour ObjectId: ' + propertyId);
            }
            // Find the user's default favorite list or create one
            let favorite = await Favorite.findOne({ userId: userId, name: 'My Favorites' });
            
            if (!favorite) {
                favorite = await Favorite.create({
                    userId: userId,
                    name: 'My Favorites',
                    properties: [new Types.ObjectId(propertyId)]
                });
            } else {
                const propertyObjectId = new Types.ObjectId(propertyId);
                
                // Initialize properties array if it doesn't exist
                if (!favorite.properties) {
                    favorite.properties = [];
                }
                
                if (!favorite.properties.some(id => id.equals(propertyObjectId))) {
                    favorite.properties.push(propertyObjectId);
                    await favorite.save();
                }
            }
            
            return favorite;
        } catch (error) {
            console.log(error);
            throw new Error('Error adding property to favorites');
        }
    }
    
    // Remove a property from user's favorites (only from array, not the whole doc)
    async removePropertyFromFavorites(userId: string, propertyId: string): Promise<boolean> {
        try {
            if (!isValidObjectId(propertyId)) {
                console.log('propertyId non valide pour ObjectId:', propertyId);
                return false;
            }
            const propertyObjectId = new Types.ObjectId(propertyId);
            const favorite = await Favorite.findOne({ userId: userId, properties: propertyObjectId });
            if (!favorite) {
                return false;
            }
            
            // Initialize properties array if it doesn't exist
            if (!favorite.properties) {
                favorite.properties = [];
            }
            
            favorite.properties = favorite.properties.filter(
                (id) => !id.equals(propertyObjectId)
            );
            await favorite.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    // Universal favorite methods
    async addUniversalFavorite(data: { userId: string, entityType: string, entityId: string, notes?: string }): Promise<Document<unknown, any, IFavorite> & IFavorite> {
        try {
            const favorite = new Favorite({
                userId: new Types.ObjectId(data.userId),
                entityType: data.entityType,
                entityId: new Types.ObjectId(data.entityId),
                notes: data.notes
            });
            
            return await favorite.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    
    async toggleUniversalFavorite(data: { userId: string, entityType: string, entityId: string, notes?: string }): Promise<{ isFavorited: boolean, favorite?: IFavorite }> {
        try {
            const existingFavorite = await Favorite.findOne({
                userId: new Types.ObjectId(data.userId),
                entityType: data.entityType,
                entityId: new Types.ObjectId(data.entityId)
            });
            
            if (existingFavorite) {
                // Remove favorite
                await Favorite.deleteOne({ _id: existingFavorite._id });
                return { isFavorited: false };
            } else {
                // Add favorite
                const newFavorite = await this.addUniversalFavorite(data);
                return { isFavorited: true, favorite: newFavorite };
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    
    async checkUniversalFavorite(userId: string, entityType: string, entityId: string): Promise<boolean> {
        try {
            const favorite = await Favorite.findOne({
                userId: new Types.ObjectId(userId),
                entityType: entityType,
                entityId: new Types.ObjectId(entityId)
            });
            
            return !!favorite;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    async getUserFavoritesByEntityType(userId: string, entityType: string): Promise<IFavorite[]> {
        try {
            const favorites = await Favorite.find({
                userId: new Types.ObjectId(userId),
                entityType: entityType
            }).populate('entityId');
            
            return favorites;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
    
    async removeUniversalFavorite(userId: string, entityType: string, entityId: string): Promise<boolean> {
        try {
            const result = await Favorite.deleteOne({
                userId: new Types.ObjectId(userId),
                entityType: entityType,
                entityId: new Types.ObjectId(entityId)
            });
            
            return result.deletedCount > 0;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

export { FavoriteService };