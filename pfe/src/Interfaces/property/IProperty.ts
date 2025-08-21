import { Document, Types } from 'mongoose';

export interface IPropertyAttachment {
    type: 'image' | 'document' | 'video';
    url: string;
    title: string;
    description?: string;
    fileSize?: number;
    mimeType?: string;
    createdAt: Date;
}

export interface IPropertyAmenity {
    category: 'indoor' | 'outdoor' | 'security' | 'community';
    name: string;
    description?: string;
    icon?: string;
}

export interface IPropertyFeature {
    name: string;
    value: string | number | boolean;
    icon?: string;
}

export interface IPropertyMedia {
    type: 'image' | 'video' | '360-view';
    url: string;
    thumbnail?: string;
    title?: string;
    description?: string;
    isPrimary: boolean;
    order: number;
}

export interface IPropertyAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
}

export interface IPropertyPricing {
    price: number;
    currency: string;
    pricePerSquareFoot?: number;
    maintenanceFee?: number;
    propertyTax?: number;
    // priceHistory: {
    //     date: Date;
    //     price: number;
    //     priceType: 'listing' | 'sale' | 'adjustment';
    // }[];
}

export interface IProperty extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    type: "Apartment" | "House" | "Villa" | "Bungalow" | "Studio" | "Penthouse" | "Duplex" | "Townhouse";
    status: "available" | "sold" | "rented" | "pending" | "off-market";
    listingType: "sale" | "rent" | "both";
    
    // Basic Details
    bedrooms: number;
    bathrooms: number;
    halfBathrooms?: number;
    size: {
        total: number;
        indoor: number;
        outdoor?: number;
        unit: 'sqft' | 'sqm';
    };
    yearBuilt: number;
    parking: {
        type: 'garage' | 'carport' | 'street' | 'none';
        spaces: number;
    };
    lotSize?: {
        size: number;
        unit: 'sqft' | 'sqm' | 'acres';
    };
    floors: number;
    unitNumber?: string;
    
    // Location
    address: IPropertyAddress;
    
    // Financial
    pricing: IPropertyPricing;
    
    // Features & Amenities
    amenities: IPropertyAmenity[];
    features: IPropertyFeature[];
    
    // Media & Attachments
    media: IPropertyMedia[];
    attachments: IPropertyAttachment[];
    virtualTour?: {
        url: string;
        provider: string;
    };
    
    // Additional Details
    constructionStatus?: 'ready' | 'under-construction' | 'pre-construction';
    furnishingStatus: 'furnished' | 'semi-furnished' | 'unfurnished';
    facing?: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
    availability: {
        date: Date;
        status: 'immediate' | 'from-date' | 'on-request';
    };
    
    // Relationships
    owner: Types.ObjectId;
    listedBy: Types.ObjectId;
    
    // Metadata
    views: number;
    favorites: number;
    featured: boolean;
    verified: boolean;
    certifications?: string[];
    tags: string[];
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastModifiedBy: Types.ObjectId;
}
