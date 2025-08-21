export interface PropertyAttachment {
  type: 'image' | 'document' | 'video';
  url: string;
  title: string;
  description?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: Date;
}

export interface PropertyAmenity {
  category: 'indoor' | 'outdoor' | 'security' | 'community';
  name: string;
  description?: string;
  icon?: string;
}

export interface PropertyFeature {
  name: string;
  value: string | number | boolean;
  icon?: string;
}

export interface PropertyMedia {
  type: 'image' | 'video' | '360-view';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyPricing {
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

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: "Apartment" | "House" | "Villa" | "Bungalow" | "Studio" | "Penthouse" | "Duplex" | "Townhouse";
  status: "available" | "sold" | "rented" | "pending" | "off-market";
  listingType: "sale" | "rent" | "both";
  
  // Basic Details
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  area: number; // For backward compatibility with templates
  price: number; // For backward compatibility with templates
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
  
  // Location - simplified for backward compatibility with templates
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  address: PropertyAddress; // Full address object
  
  // Financial
  pricing: PropertyPricing;
  
  // Features & Amenities
  amenities: PropertyAmenity[];
  features: PropertyFeature[];
  
  // Media & Attachments - simplified for backward compatibility with templates
  images: string[]; // Array of image URLs for backward compatibility with templates
  media: PropertyMedia[];
  attachments: PropertyAttachment[];
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
  owner: string; // ID of the user
  listedBy: string; // ID of the user
  agent?: { // For backward compatibility
    name: string;
    phone: string;
    email?: string;
  };
  
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
  lastModifiedBy: string; // ID of the user
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  type: "Apartment" | "House" | "Villa" | "Bungalow" | "Studio" | "Penthouse" | "Duplex" | "Townhouse";
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  amenities: string[];
}
