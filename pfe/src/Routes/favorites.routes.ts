// Importing modules
import express from 'express';
import { FavoriteController } from '../Controllers/favorite.controller'; // Import the FavoriteController
import { diContainer } from '../DI/iversify.config';
import { FavoriteTYPES } from '../DI/Favorite/FavoriteTypes'; // Ensure the path is correct
import { authenticateToken } from '../Middlewares/auth.middleware';

// Initiating the router
export const router = express.Router();

// Getting the controller instance from the DI container
const controller = diContainer.get<FavoriteController>(FavoriteTYPES.favoriteController); // Get FavoriteController from DI container

// Favorite routes
router.post('/', authenticateToken, controller.addFavorite); // Create a new favorite
router.get('/', controller.getFavorites); // Get all favorites
router.get('/:id', controller.getFavorite); // Get a single favorite by ID
router.put('/:id', authenticateToken, controller.updateFavorite); // Update a favorite
router.delete('/:id', authenticateToken, controller.deleteFavorite); // Delete a favorite
router.put('/:id/property', authenticateToken, controller.addPropertyToFavorite); // Add a property to a favorite
router.get('/user/:userId', authenticateToken, controller.findFavoriteByUser); // Find favorites by user ID
router.get('/user', authenticateToken, controller.findFavoriteByUser); // Find favorites for current user
router.get('/name/:name', controller.findFavoriteByName); // Find favorites by name
router.get('/check/:propertyId', authenticateToken, controller.checkFavorite); // Check if property is in favorites
router.delete('/property/:propertyId', authenticateToken, controller.removePropertyFromFavorites); // Remove property from favorites

// Universal favorite routes
router.post('/universal', authenticateToken, controller.addUniversalFavorite); // Add universal favorite
router.post('/toggle', authenticateToken, controller.toggleUniversalFavorite); // Toggle universal favorite
router.get('/check/:userId/:entityType/:entityId', controller.checkUniversalFavorite); // Check if entity is favorited
router.get('/user/:userId/:entityType', controller.getUserFavoritesByEntityType); // Get user favorites by entity type
router.delete('/user/:userId/:entityType/:entityId', authenticateToken, controller.removeUniversalFavorite); // Remove universal favorite

export default router;