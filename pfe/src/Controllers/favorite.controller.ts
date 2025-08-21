import { FavoriteService } from '../Services/favorite.service';  // Assuming you have a FavoriteService
import { injectable, inject } from 'inversify';
import { FavoriteTYPES } from "../DI/Favorite/FavoriteTypes"; // Ensure the path is correct
import { Request, Response } from 'express';
import { IFavorite } from '../Interfaces/favorite/IFavorite';
import { FavoriteSchemaValidate } from '../Models/favorite'; // Assuming you have a Favorite schema validator
import { AuthenticatedUser } from '../types/auth';

@injectable()
class FavoriteController {
    private service: FavoriteService;

    constructor(@inject(FavoriteTYPES.favoriteService) service: FavoriteService) {
        this.service = service;
    }

    // Get all favorites
    getFavorites = async (req: Request, res: Response) => {
        const favorites = await this.service.getFavorites();
        res.status(200).send(favorites);
    }

    // Get a single favorite
    getFavorite = async (req: Request, res: Response) => {
        const id = req.params.id;
        const favorite = await this.service.getFavorite(id);
        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }
        res.status(200).send(favorite);
    }

    // Add a new favorite
    addFavorite = async (req: Request, res: Response) => {
        const { error, value } = FavoriteSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        
        // If user is authenticated, use their ID
        if (req.user) {
            value.userId = (req.user as AuthenticatedUser)._id;
        }
        
        const favorite = await this.service.createFavorite(value); // Pass validated data
        res.status(201).send(favorite);
    }

    // Update a favorite
    updateFavorite = async (req: Request, res: Response) => {
        const id = req.params.id;
        const favorite = await this.service.updateFavorite(id, req.body);
        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }
        res.status(200).send(favorite);
    }

    // Delete a favorite
    deleteFavorite = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteFavorite(id);
        res.status(200).send({ message: 'Favorite deleted' });
    }

    // Add a property to an existing favorite
    addPropertyToFavorite = async (req: Request, res: Response) => {
        const id = req.params.id;
        const property = req.body; // Assuming property is sent in the request body
        const favorite = await this.service.addPropertyToFavorite(id, property);
        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }
        res.status(200).send(favorite);
    }

    // Find favorites by a specific user
    findFavoriteByUser = async (req: Request, res: Response) => {
        const userId = req.params.userId || (req.user ? (req.user as AuthenticatedUser)._id : null);
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID required' });
        }
        
        const favorites = await this.service.findFavoriteByUser(userId);
        if (!favorites || favorites.length === 0) {
            return res.status(404).json({ message: 'No favorites found for this user' });
        }
        res.status(200).send(favorites);
    }

    // Find favorites by name
    findFavoriteByName = async (req: Request, res: Response) => {
        const name = req.params.name;
        const favorites = await this.service.findFavoriteByName(name);
        if (!favorites || favorites.length === 0) {
            return res.status(404).json({ message: 'No favorites found with this name' });
        }
        res.status(200).send(favorites);
    }
    
    // Check if a property is in user's favorites
    checkFavorite = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        const userId = req.user ? (req.user as AuthenticatedUser)._id : null;
        
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const isFavorite = await this.service.checkPropertyInFavorites(userId, propertyId);
        res.status(200).json({ isFavorite });
    }
    
    // Remove a property from user's favorites
    removePropertyFromFavorites = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        const userId = req.user ? (req.user as AuthenticatedUser)._id : null;
        
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const result = await this.service.removePropertyFromFavorites(userId, propertyId);
        if (!result) {
            return res.status(404).json({ message: 'Property not found in favorites' });
        }
        
        res.status(200).json({ message: 'Property removed from favorites' });
    }
    
    // Universal favorite endpoints
    addUniversalFavorite = async (req: Request, res: Response) => {
        const { userId, entityType, entityId, notes } = req.body;
        
        if (!userId || !entityType || !entityId) {
            return res.status(400).json({ message: 'userId, entityType, and entityId are required' });
        }
        
        try {
            const favorite = await this.service.addUniversalFavorite({ userId, entityType, entityId, notes });
            res.status(201).json(favorite);
        } catch (error) {
            console.error('Error adding universal favorite:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    toggleUniversalFavorite = async (req: Request, res: Response) => {
        const { userId, entityType, entityId, notes } = req.body;
        
        if (!userId || !entityType || !entityId) {
            return res.status(400).json({ message: 'userId, entityType, and entityId are required' });
        }
        
        try {
            const result = await this.service.toggleUniversalFavorite({ userId, entityType, entityId, notes });
            res.status(200).json(result);
        } catch (error) {
            console.error('Error toggling universal favorite:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    checkUniversalFavorite = async (req: Request, res: Response) => {
        const { userId, entityType, entityId } = req.params;
        
        try {
            const isFavorited = await this.service.checkUniversalFavorite(userId, entityType, entityId);
            res.status(200).json({ isFavorited });
        } catch (error) {
            console.error('Error checking universal favorite:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    getUserFavoritesByEntityType = async (req: Request, res: Response) => {
        const { userId, entityType } = req.params;
        
        try {
            const favorites = await this.service.getUserFavoritesByEntityType(userId, entityType);
            res.status(200).json(favorites);
        } catch (error) {
            console.error('Error getting user favorites by entity type:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    removeUniversalFavorite = async (req: Request, res: Response) => {
        const { userId, entityType, entityId } = req.params;
        
        try {
            const removed = await this.service.removeUniversalFavorite(userId, entityType, entityId);
            if (removed) {
                res.status(200).json({ message: 'Favorite removed successfully' });
            } else {
                res.status(404).json({ message: 'Favorite not found' });
            }
        } catch (error) {
            console.error('Error removing universal favorite:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export { FavoriteController };