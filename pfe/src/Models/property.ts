import { Schema, model, Types } from 'mongoose';
import Joi from 'joi';
import { IProperty } from '../Interfaces/property/IProperty';

// Media Schema for Validation
const PropertyMediaSchema = Joi.object({
    type: Joi.string().valid('image', 'video', '360-view').default('image'),
    url: Joi.string().allow('', null), // Make URL optional
    thumbnail: Joi.string().allow('', null),
    title: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    isPrimary: Joi.boolean().default(false),
    order: Joi.number().default(0)
});

// Validation schema
export const PropertySchemaValidate = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid(
        "Apartment", "House", "Villa", "Bungalow", "Studio", 
        "Penthouse", "Duplex", "Townhouse"
    ).required(),
    status: Joi.string().valid(
        "available", "sold", "rented", "pending", "off-market"
    ).required(),
    listingType: Joi.string().valid("sale", "rent", "both").required(),
    
    // Basic Details
    bedrooms: Joi.number().required().min(0),
    bathrooms: Joi.number().required().min(0),
    halfBathrooms: Joi.number().required().min(0),
    size: Joi.object({
        total: Joi.number().required().min(1),
        indoor: Joi.number().required().min(1),
        outdoor: Joi.number().required().min(0),
        unit: Joi.string().valid('sqft', 'sqm')
    }),
    yearBuilt: Joi.number().optional(),
    parking: Joi.object({
        type: Joi.string().valid('garage', 'carport', 'street', 'none').required(),
        spaces: Joi.number().required().min(0)
    }).required(),
    lotSize: Joi.object({
        size: Joi.number().required().min(0),
        unit: Joi.string().valid('sqft', 'sqm', 'acres').required()
    }).required(),
    floors: Joi.number().required().min(1),
    unitNumber: Joi.string().optional(),
    
    // Location
    address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().required(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional()
    }).required(),
    
    // Financial
    pricing: Joi.object({
        price: Joi.number().required().min(0),
        currency: Joi.string().required(),
        pricePerSquareFoot: Joi.number().optional(),
        maintenanceFee: Joi.number().optional(),
        propertyTax: Joi.number().optional(),
        // priceHistory: Joi.array().items(Joi.object({
        //     date: Joi.date().required(),
        //     price: Joi.number().required(),
        //     priceType: Joi.string().valid('listing', 'sale', 'adjustment').required()
        // })).required()
    }).required(),
    
    // Features & Amenities
    amenities: Joi.array().items(Joi.object({
        category: Joi.string().valid('indoor', 'outdoor', 'security', 'community').optional(),
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        icon: Joi.string().optional()
    })).optional(),
    
    features: Joi.array().items(Joi.object({
        name: Joi.string().optional(),
        value: Joi.alternatives().try(
            Joi.string(),
            Joi.number(),
            Joi.boolean()
        ).optional(),
        icon: Joi.string().optional()
    })).optional(),
    
    // Media & Attachments
    media: Joi.array().items(PropertyMediaSchema).default([]),
    
    attachments: Joi.array().items(Joi.object({
        type: Joi.string().valid('image', 'document', 'video').optional(),
        url: Joi.string().optional(),
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        fileSize: Joi.number().optional(),
        mimeType: Joi.string().optional()
    })).optional(),
    
    virtualTour: Joi.object({
        url: Joi.string().optional(),
        provider: Joi.string().optional()
    }).optional(),
    
    // Additional Details
    constructionStatus: Joi.string().valid('ready', 'under-construction', 'pre-construction').required(),
    furnishingStatus: Joi.string().valid('furnished', 'semi-furnished', 'unfurnished').required(),
    facing: Joi.string().valid(
        'north', 'south', 'east', 'west',
        'northeast', 'northwest', 'southeast', 'southwest'
    ).optional(),
    availability: Joi.object({
        date: Joi.date().required(),
        status: Joi.string().valid('immediate', 'from-date', 'on-request').required()
    }).required(),
    
    // Relationships
    owner: Joi.string().required(),
    listedBy: Joi.string().required(),
    
    // Metadata
    views: Joi.number().default(0),
    favorites: Joi.number().default(0),
    featured: Joi.boolean().default(false),
    verified: Joi.boolean().default(false),
    certifications: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    lastModifiedBy: Joi.string().required()
});

// Property Schema
const propertySchema = new Schema<IProperty>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: { 
            type: String, 
            enum: ["Apartment", "House", "Villa", "Bungalow", "Studio", "Penthouse", "Duplex", "Townhouse"],
            required: true 
        },
        status: {
            type: String,
            enum: ["available", "sold", "rented", "pending", "off-market"],
            required: true
        },
        listingType: {
            type: String,
            enum: ["sale", "rent", "both"],
            required: true
        },
        
        // Basic Details
        bedrooms: { type: Number, required: true, min: 0 },
        bathrooms: { type: Number, required: true, min: 0 },
        halfBathrooms: { type: Number, min: 0 },
        size: {
            total: { type: Number, required: false, min: 1 },
            indoor: { type: Number, required: false, min: 1 },
            outdoor: { type: Number },
            unit: { type: String, enum: ['sqft', 'sqm'], required: false }
        },
        yearBuilt: { type: Number, required: true },
        parking: {
            type: { type: String, enum: ['garage', 'carport', 'street', 'none'], required: true },
            spaces: { type: Number, required: true, min: 0 }
        },
        lotSize: {
            size: { type: Number, min: 0 },
            unit: { type: String, enum: ['sqft', 'sqm', 'acres'] }
        },
        floors: { type: Number, required: true, min: 1 },
        unitNumber: { type: String },
        
        // Location
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            postalCode: { type: String, required: true },
            latitude: { type: Number },
            longitude: { type: Number }
        },
        
        // Financial
        pricing: {
            price: { type: Number, required: true, min: 0 },
            currency: { type: String, required: true },
            pricePerSquareFoot: { type: Number },
            maintenanceFee: { type: Number },
            propertyTax: { type: Number },
            priceHistory: [{
                date: { type: Date, required: true },
                price: { type: Number, required: true },
                priceType: { 
                    type: String, 
                    enum: ['listing', 'sale', 'adjustment'],
                    required: true  
                }
            }]
        },
        
        // Features & Amenities
        amenities: [{
            category: { 
                type: String,
                enum: ['indoor', 'outdoor', 'security', 'community'],
                required: true
            },
            name: { type: String, required: true },
            description: { type: String },
            icon: { type: String }
        }],
        
        features: [{
            name: { type: String, required: true },
            value: { type: Schema.Types.Mixed, required: true },
            icon: { type: String }
        }],
        
        // Media & Attachments
        media: [{
            type: { 
                type: String,
                enum: ['image', 'video', '360-view'],
                required: true
            },
            url: { type: String, required: true },
            thumbnail: { type: String },
            title: { type: String },
            description: { type: String },
            isPrimary: { type: Boolean, required: true },
            order: { type: Number, required: true }
        }],
        
        attachments: [{
            type: { 
                type: String,
                enum: ['image', 'document', 'video'],
                required: true
            },
            url: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String },
            fileSize: { type: Number },
            mimeType: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        
        virtualTour: {
            url: { type: String },
            provider: { type: String }
        },
        
        // Additional Details
        constructionStatus: {
            type: String,
            enum: ['ready', 'under-construction', 'pre-construction']
        },
        furnishingStatus: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished'],
            required: true
        },
        facing: {
            type: String,
            enum: [
                'north', 'south', 'east', 'west',
                'northeast', 'northwest', 'southeast', 'southwest'
            ]
        },
        availability: {
            date: { type: Date, required: true },
            status: {
                type: String,
                enum: ['immediate', 'from-date', 'on-request'],
                required: true
            }
        },
        
        // Relationships
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        listedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        
        // Metadata
        views: { type: Number, default: 0 },
        favorites: { type: Number, default: 0 },
        featured: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        certifications: [{ type: String }],
        tags: [{ type: String }],
        lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

// Indexes for better query performance
propertySchema.index({ 'address.city': 1 });
propertySchema.index({ 'address.state': 1 });
propertySchema.index({ 'address.country': 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ 'pricing.price': 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ listedBy: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ 
    'address.city': 'text',
    'address.state': 'text',
    title: 'text',
    description: 'text',
    tags: 'text'
});

export const Property = model<IProperty>('Property', propertySchema);