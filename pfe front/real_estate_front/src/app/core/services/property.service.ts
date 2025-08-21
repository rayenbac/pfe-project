import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Property } from '../models/property.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = `${environment.apiBaseUrl}/properties`; // Replace with your API base URL

  // Add getter for apiUrl
  public getApiUrl(): string {
    return this.apiUrl;
  }

  constructor(private http: HttpClient) {}

  // Get all properties
  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  // Get a single property by ID
  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  // Get properties by owner
  getPropertiesByOwner(ownerId: string): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/owner/${ownerId}`);
  }

  // Get agent's properties
  getAgentProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/agent/current`);
  }

  // Create property
  createProperty(property: any): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, property);
  }
  
  // Add a new property (send form-data)
  addProperty(formData: FormData): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, formData);
  }

  // Update a property (send form-data)
  updateProperty(id: string, formData: FormData): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, formData);
  }

  // Upload property images
  uploadPropertyImages(propertyId: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<any>(`${this.apiUrl}/${propertyId}/images`, formData);
  }

  // Delete a property
  deleteProperty(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Search properties with criteria
  searchProperties(criteria: any): Observable<Property[]> {
    // First try the server-side search
    return new Observable(observer => {
      this.http.get<Property[]>(`${this.apiUrl}/search`, { params: criteria }).subscribe({
        next: (properties) => {
          observer.next(properties);
          observer.complete();
        },
        error: (error) => {
          console.warn('Server search failed, falling back to client-side search:', error);
          // Fallback to client-side filtering
          this.getProperties().subscribe({
            next: (allProperties) => {
              const filtered = this.filterPropertiesClientSide(allProperties, criteria);
              observer.next(filtered);
              observer.complete();
            },
            error: (clientError) => {
              observer.error(clientError);
            }
          });
        }
      });
    });
  }

  // Client-side filtering fallback
  private filterPropertiesClientSide(properties: Property[], criteria: any): Property[] {
    console.log('Filtering properties client-side with criteria:', criteria);
    console.log('Total properties to filter:', properties.length);
    
    // Log all property types to help debug
    const propertyTypes = properties.map(p => p.type);
    console.log('Available property types:', [...new Set(propertyTypes)]);
    
    return properties.filter(property => {
      // Check listing type (sale/rent)
      if (criteria.listingType && property.listingType !== criteria.listingType) {
        console.log(`Property ${property.title} filtered out: listingType mismatch (${property.listingType} vs ${criteria.listingType})`);
        return false;
      }

      // Check property type with more flexible matching
      if (criteria.type) {
        const criteriaType = criteria.type.toLowerCase().trim();
        const propertyType = property.type.toLowerCase().trim();
        
        // Exact match
        if (propertyType === criteriaType) {
          // Match found, continue to other criteria
        }
        // Partial match or common variations
        else if (
          (criteriaType === 'villa' && (propertyType.includes('villa') || propertyType.includes('house'))) ||
          (criteriaType === 'apartment' && (propertyType.includes('apartment') || propertyType.includes('flat'))) ||
          (criteriaType === 'house' && (propertyType.includes('house') || propertyType.includes('villa'))) ||
          propertyType.includes(criteriaType) || criteriaType.includes(propertyType)
        ) {
          // Partial match found, continue to other criteria
          console.log(`Property ${property.title} matched type: ${propertyType} ~ ${criteriaType}`);
        }
        else {
          console.log(`Property ${property.title} filtered out: type mismatch (${propertyType} vs ${criteriaType})`);
          return false;
        }
      }

      // Check keyword in title or description
      if (criteria.keyword) {
        const keyword = criteria.keyword.toLowerCase();
        const titleMatch = property.title.toLowerCase().includes(keyword);
        const descMatch = property.description.toLowerCase().includes(keyword);
        if (!titleMatch && !descMatch) {
          console.log(`Property ${property.title} filtered out: keyword mismatch`);
          return false;
        }
      }

      // Check bedrooms
      if (criteria.bedrooms && property.bedrooms !== parseInt(criteria.bedrooms)) {
        console.log(`Property ${property.title} filtered out: bedrooms mismatch (${property.bedrooms} vs ${criteria.bedrooms})`);
        return false;
      }

      // Check bathrooms
      if (criteria.bathrooms && property.bathrooms !== parseInt(criteria.bathrooms)) {
        console.log(`Property ${property.title} filtered out: bathrooms mismatch`);
        return false;
      }

      // Check location (if address exists)
      if (criteria.location && property.address) {
        const location = criteria.location.toLowerCase();
        const addressMatch = property.address.city?.toLowerCase().includes(location) ||
                            property.address.state?.toLowerCase().includes(location) ||
                            property.address.country?.toLowerCase().includes(location);
        if (!addressMatch) {
          console.log(`Property ${property.title} filtered out: location mismatch`);
          return false;
        }
      }

      // Check price range (if pricing exists)
      if (criteria.price && property.pricing) {
        const propertyPrice = property.pricing.price;
        if (criteria.price.min && propertyPrice < criteria.price.min) {
          console.log(`Property ${property.title} filtered out: price too low`);
          return false;
        }
        if (criteria.price.max && propertyPrice > criteria.price.max) {
          console.log(`Property ${property.title} filtered out: price too high`);
          return false;
        }
      }

      // Check year built
      if (criteria.yearBuilt && property.yearBuilt !== parseInt(criteria.yearBuilt)) {
        console.log(`Property ${property.title} filtered out: year built mismatch`);
        return false;
      }

      console.log(`Property ${property.title} passed all filters!`);
      return true;
    });
  }

  // Get featured properties
  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/featured`);
  }

  // Get cities with property count
  getCitiesWithPropertyCount(): Observable<{ city: string, count: number }[]> {
    return this.http.get<{ city: string, count: number }[]>(`${this.apiUrl}/cities`);
  }

  // Get property by slug (title-based URL)
  getPropertyBySlug(slug: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/by-slug/${slug}`);
  }

  // Get similar properties (simple approach for property details page)
  getSimilarProperties(propertyId: string, limit: number = 5): Observable<{
    propertyId: string;
    similarProperties: Property[];
    totalCount: number;
  }> {
    const url = `${this.apiUrl}/${propertyId}/similar?limit=${limit}`;
    console.log(`🔍 [FRONTEND PROPERTY SERVICE] Fetching similar properties from: ${url}`);
    
    return this.http.get<{
      propertyId: string;
      similarProperties: Property[];
      totalCount: number;
    }>(url).pipe(
      tap(response => {
        console.log(`📊 [FRONTEND PROPERTY SERVICE] Similar properties response:`, response);
        console.log(`📈 [FRONTEND PROPERTY SERVICE] Found ${response.similarProperties?.length || 0} similar properties`);
      }),
      catchError(error => {
        console.error('❌ [FRONTEND PROPERTY SERVICE] Error fetching similar properties:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility function to convert title to URL-friendly slug
  static createSlug(title: string): string {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Utility function to get property URL with slug
  static getPropertyUrl(property: Property): string {
    const slug = PropertyService.createSlug(property.title);
    return `/property/${slug}`;
  }
}