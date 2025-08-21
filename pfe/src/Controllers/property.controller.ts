import { PropertyService } from '../Services/property.service';
import { injectable, inject } from 'inversify';
import { PropertyTYPES } from "../DI/Property/PropertyTypes";
import { Request, Response } from 'express';
import { PropertySchemaValidate } from '../Models/property';
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';
import mongoose from 'mongoose';
import { User } from '../Models/user';
import { AuthenticatedUser } from '../types/auth';
import { realtimeNotificationService } from '../Server/app';

@injectable()
class PropertyController {
    private service: PropertyService;
    private uploadService: UploadService;

    constructor(@inject(PropertyTYPES.propertyService) service: PropertyService) {
        this.service = service;
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    // Add a new property
    addProperty = async (req: Request, res: Response) => {
        try {
            const { error, value } = PropertySchemaValidate.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            // Get the logged-in user's ID from JWT token
            if (!req.user) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const userId = (req.user as AuthenticatedUser)._id;
            
            // Check if user is verified and has a digital signature (for rental properties)
            if (value.listingType === 'rent') {
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // Check if user is verified
                if (!user.isVerified) {
                    return res.status(403).json({ 
                        message: 'Account verification required',
                        details: 'You must complete identity verification before posting rental properties. Please upload your verification documents in your profile settings.',
                        requiresVerification: true
                    });
                }

                // Check if user has a digital signature
                if (!user.digitalSignature || !user.digitalSignature.signatureImage || !user.digitalSignature.isActive) {
                    return res.status(403).json({ 
                        message: 'Digital signature required',
                        details: 'You must create a digital signature before posting rental properties. Please add your signature in your profile settings.',
                        requiresSignature: true
                    });
                }
            }

            // Set the owner to the authenticated user
            value.owner = userId;

            // Handle image uploads and attachments using multer.fields
            if (req.files && typeof req.files === 'object') {
                // Images
                const mediaFiles = (req.files as any).images || [];
                value.media = mediaFiles.map((file: Express.Multer.File, index: number) => ({
                    type: 'image',
                    url: this.uploadService.getFilePath(file.filename, 'property'),
                    isPrimary: index === 0,
                    order: index + 1
                }));

                // Attachments
                const attachmentFiles = (req.files as any).attachments || [];
                if (attachmentFiles.length > 0) {
                    value.attachments = attachmentFiles.map((file: Express.Multer.File) => ({
                        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
                        url: this.uploadService.getFilePath(file.filename, 'property-attachment'),
                        title: file.originalname,
                        description: '',
                        fileSize: file.size,
                        mimeType: file.mimetype
                    }));
                }
            }

            const property = await this.service.createProperty(value);
            
            // Send notification to admin about new property
            if (property && realtimeNotificationService && req.user) {
                const user = await User.findById((req.user as AuthenticatedUser)._id);
                if (user) {
                    await realtimeNotificationService.notifyAdminNewProperty({
                        propertyId: property._id.toString(),
                        createdBy: `${user.firstName} ${user.lastName}`,
                        property: property
                    });
                }
            }
            
            res.status(201).send(property);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Update a property
    updateProperty = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updateData = { ...req.body };

            // Check if we should preserve existing media
            const preserveExistingMedia = req.body.preserveExistingMedia === 'true';
            
            // If preserveExistingMedia is true, don't update media
            if (preserveExistingMedia) {
                delete updateData.media;
            } 
            // Otherwise, handle image uploads if there are any
            else if (req.files && typeof req.files === 'object' && ((req.files as any).images?.length > 0)) {
                const mediaFiles = (req.files as any).images || [];
                if (updateData.media && Array.isArray(updateData.media)) {
                    // Process new uploads and add them to existing media
                    const newMedia = mediaFiles.map((file: Express.Multer.File, index: number) => ({
                        type: 'image',
                        url: this.uploadService.getFilePath(file.filename, 'property'),
                        isPrimary: false, // We'll set primary status later
                        order: updateData.media.length + index + 1
                    }));
                    updateData.media = [...updateData.media, ...newMedia];
                    // Ensure only one image is primary
                    let hasPrimary = false;
                    updateData.media.forEach((media: any, index: number) => {
                        if (media.isPrimary) {
                            if (hasPrimary) {
                                media.isPrimary = false;
                            } else {
                                hasPrimary = true;
                            }
                        }
                    });
                    // If no primary image, set the first one as primary
                    if (!hasPrimary && updateData.media.length > 0) {
                        updateData.media[0].isPrimary = true;
                    }
                } else {
                    // No existing media in request, just use the new uploads
                    updateData.media = mediaFiles.map((file: Express.Multer.File, index: number) => ({
                        type: 'image',
                        url: this.uploadService.getFilePath(file.filename, 'property'),
                        isPrimary: index === 0,
                        order: index + 1
                    }));
                }
            }

            // Handle attachments for update
            if (req.files && typeof req.files === 'object') {
                const attachmentFiles = (req.files as any).attachments || [];
                if (attachmentFiles.length > 0) {
                    updateData.attachments = (updateData.attachments && Array.isArray(updateData.attachments)) ? updateData.attachments : [];
                    const newAttachments = attachmentFiles.map((file: Express.Multer.File) => ({
                        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
                        url: this.uploadService.getFilePath(file.filename, 'property-attachment'),
                        title: file.originalname,
                        description: '',
                        fileSize: file.size,
                        mimeType: file.mimetype
                    }));
                    updateData.attachments = [...updateData.attachments, ...newAttachments];
                }
            }

            const property = await this.service.updateProperty(id, updateData);
            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }

            // Send notifications about property update
            if (realtimeNotificationService && req.user) {
                const user = await User.findById((req.user as AuthenticatedUser)._id);
                if (user) {
                    // Notify admin about property update
                    await realtimeNotificationService.notifyAdminPropertyUpdated({
                        propertyId: property._id.toString(),
                        updatedBy: `${user.firstName} ${user.lastName}`,
                        property: property
                    });

                    // Notify users who have this property as favorite
                    await realtimeNotificationService.notifyFavoritePropertyUpdate(
                        property._id.toString(),
                        {
                            action: 'property_updated',
                            property: property
                        }
                    );
                }
            }

            res.status(200).send(property);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Get all properties
    getProperties = async (req: Request, res: Response) => {
        const properties = await this.service.getProperties();
        res.status(200).send(properties);
    }

    // Get a single property
    getProperty = async (req: Request, res: Response) => {
        const id = req.params.id;
        const property = await this.service.getProperty(id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.status(200).send(property);
    }

    // Get property by slug
    getPropertyBySlug = async (req: Request, res: Response) => {
        const slug = req.params.slug;
        const property = await this.service.getPropertyBySlug(slug);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.status(200).send(property);
    }

    // Get property by title
    getPropertyByTitle = async (req: Request, res: Response) => {
        try {
            const titleSlug = req.params.titleSlug;
            const property = await this.service.getPropertyBySlug(titleSlug);
            
            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }
            
            return res.status(200).json(property);
        } catch (error) {
            console.error('Error fetching property by title:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get similar properties
    getSimilarProperties = async (req: Request, res: Response) => {
        try {
            const propertyId = req.params.id;
            const limit = parseInt(req.query.limit as string) || 6;
            
            console.log(`🔍 [SIMILAR PROPERTIES] Searching for similar properties to property ID: ${propertyId}, limit: ${limit}`);
            
            const similarProperties = await this.service.getSimilarProperties(propertyId, limit);
            
            console.log(`📊 [SIMILAR PROPERTIES] Found ${similarProperties?.length || 0} similar properties`);
            console.log('📋 [SIMILAR PROPERTIES] Results:', JSON.stringify(similarProperties, null, 2));
            
            if (!similarProperties || similarProperties.length === 0) {
                console.log(`⚠️ [SIMILAR PROPERTIES] No similar properties found for property ID: ${propertyId}`);
                return res.status(200).json({
                    propertyId,
                    similarProperties: [],
                    totalCount: 0,
                    message: 'No similar properties found'
                });
            }
            
            return res.status(200).json({
                propertyId,
                similarProperties,
                totalCount: similarProperties.length
            });
        } catch (error) {
            console.error('❌ [SIMILAR PROPERTIES] Error fetching similar properties:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Delete a property
    deleteProperty = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteProperty(id);
        res.status(200).send({ message: 'Property deleted' });
    }

    // Find properties by owner
    findPropertyByOwner = async (req: Request, res: Response) => {
        const ownerId = req.params.ownerId;
        const properties = await this.service.findPropertyByOwner(ownerId);
        if (!properties || properties.length === 0) {
            return res.status(404).json({ message: 'No properties found for this owner' });
        }
        res.status(200).send(properties);
    }

    // Get current user's properties
    getCurrentUserProperties = async (req: Request, res: Response) => {
        try {
            // Get the logged-in user's ID from JWT token
            if (!req.user) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const userId = (req.user as AuthenticatedUser)._id;
            const properties = await this.service.findPropertyByOwner(userId);
            
            res.status(200).send(properties || []);
        } catch (error: any) {
            console.error('Error fetching current user properties:', error);
            res.status(500).json({ message: 'Failed to fetch properties' });
        }
    }

    // Find properties by location
    findPropertyByLocation = async (req: Request, res: Response) => {
        const location = req.params.location;
        const properties = await this.service.findPropertyByLocation(location);
        if (!properties || properties.length === 0) {
            return res.status(404).json({ message: 'No properties found at this location' });
        }
        res.status(200).send(properties);
    }

    // Find properties by type
    findPropertyByType = async (req: Request, res: Response) => {
        const type = req.params.type;
        const properties = await this.service.findPropertyByType(type);
        if (!properties || properties.length === 0) {
            return res.status(404).json({ message: 'No properties found of this type' });
        }
        res.status(200).send(properties);
    }

    // Search properties with criteria
    searchProperties = async (req: Request, res: Response) => {
        try {
            const criteria = req.query;
            const properties = await this.service.searchProperties(criteria);
            res.status(200).send(properties);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Get featured properties
    getFeaturedProperties = async (req: Request, res: Response) => {
        try {
            const properties = await this.service.searchProperties({ featured: true });
            res.status(200).send(properties);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get cities with property count
    getCitiesWithPropertyCount = async (req: Request, res: Response) => {
        try {
            const cities = await this.service.getCitiesWithPropertyCount();
            res.status(200).send(cities);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Debug endpoint to check collections
    debugCollections = async (req: Request, res: Response) => {
        try {
            const db = mongoose.connection.db;
            if (!db) {
                return res.status(500).json({ error: 'Database not connected' });
            }

            // List all collections
            const collections = await db.listCollections().toArray();
            console.log('Available collections:', collections.map(c => c.name));

            const result: any = {
                collections: collections.map(c => c.name),
                details: {}
            };

            // Check each collection for property-like data
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                result.details[col.name] = { count };
                
                if (count > 0) {
                    const sample = await db.collection(col.name).findOne();
                    const fields = Object.keys(sample || {});
                    result.details[col.name].sampleFields = fields;
                    
                    // Check if it looks like properties
                    if (sample && (sample.title || sample.price || sample.type || sample.address)) {
                        result.details[col.name].looksLikeProperty = true;
                        result.details[col.name].sample = sample;
                    }
                }
            }

            res.json(result);
        } catch (error) {
            console.error('Debug collections error:', error);
            res.status(500).json({ error: 'Failed to check collections' });
        }
    }

    // Debug endpoint to create default user for testing
    createTestUser = async (req: Request, res: Response) => {
        try {
            // Check if user already exists
            const existingUser = await User.findById('67bdd5eb492179aaecb6f8f8');
            if (existingUser) {
                return res.json({ message: 'User already exists', user: existingUser });
            }

            // Create a test user with the specific ID that properties reference
            const testUser = new User({
                _id: '67bdd5eb492179aaecb6f8f8',
                firstName: 'John',
                lastName: 'Doe',
                email: 'agent@example.com',
                password: 'hashedpassword123',
                phone: '+1234567890',
                role: 'agent',
                isVerified: true
            });

            await testUser.save();
            
            res.json({ message: 'Test user created successfully', user: testUser });
        } catch (error) {
            console.error('Create test user error:', error);
            res.status(500).json({ error: 'Failed to create test user', details: error });
        }
    }
}

export { PropertyController };