import express from 'express';
import { PropertyController } from '../Controllers/property.controller';
import { diContainer } from '../DI/iversify.config';
import { PropertyTYPES } from '../DI/Property/PropertyTypes';
import { uploadPropertyMediaAndAttachments, handleUploadError } from '../Middlewares/upload.middleware';
import { authenticateToken } from '../Middlewares/auth.middleware';

export const router = express.Router();

const controller = diContainer.get<PropertyController>(PropertyTYPES.propertycontroller);

// Property routes
router.post('/', 
    authenticateToken,
    uploadPropertyMediaAndAttachments,
    handleUploadError,
    controller.addProperty
);

router.get('/', controller.getProperties);
router.get('/search', controller.searchProperties);
router.get('/featured', controller.getFeaturedProperties);
router.get('/cities', controller.getCitiesWithPropertyCount);
router.get('/:id/similar', controller.getSimilarProperties);
router.get('/agent/current', authenticateToken, controller.getCurrentUserProperties);
router.get('/:id', controller.getProperty);
router.get('/by-slug/:slug', controller.getPropertyBySlug);
router.get('/by-title/:titleSlug', controller.getPropertyByTitle); // Add this route

router.put('/:id', 
    authenticateToken,
    uploadPropertyMediaAndAttachments,
    handleUploadError,
    controller.updateProperty
);

router.delete('/:id', authenticateToken, controller.deleteProperty);
router.get('/owner/:ownerId', controller.findPropertyByOwner);
router.get('/location/:location', controller.findPropertyByLocation);
router.get('/type/:type', controller.findPropertyByType);

export default router;