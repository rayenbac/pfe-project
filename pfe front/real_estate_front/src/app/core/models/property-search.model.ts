// src/app/models/property-search.model.ts
export interface PropertySearch {
  keyword?: string;
  listingType?: 'rent' | 'sale';
  propertyType?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
}