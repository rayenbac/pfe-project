import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { CookieConsentService } from './cookie-consent.service';
import { Property } from '../models/property.model';

export interface ViewedProperty {
  id: string;
  type: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  category: string;
  timestamp: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timestamp: number;
}

export interface PropertyPreferences {
  preferredTypes: string[];
  priceRange: { min: number; max: number };
  preferredLocations: string[];
  averageBedrooms: number;
  averageBathrooms: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyTrackingService {
  private readonly VIEWED_PROPERTIES_COOKIE = 'viewed_properties';
  private readonly USER_LOCATION_COOKIE = 'user_location';
  private readonly PROPERTY_PREFERENCES_COOKIE = 'property_preferences';
  private readonly COOKIE_EXPIRY_DAYS = 7;
  private readonly MAX_VIEWED_PROPERTIES = 5;

  constructor(
    private cookieService: CookieService,
    private consentService: CookieConsentService
  ) {}

  public trackPropertyView(property: Property): void {
    if (!this.consentService.canUsePreferencesCookies()) {
      return;
    }

    const viewedProperty: ViewedProperty = {
      id: property._id,
      type: property.type,
      location: property.address.city,
      price: property.pricing.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      category: this.categorizeProperty(property),
      timestamp: Date.now()
    };

    const viewedProperties = this.getViewedProperties();
    
    // Remove existing entry for this property if it exists
    const filteredProperties = viewedProperties.filter(p => p.id !== property._id);
    
    // Add new entry at the beginning
    filteredProperties.unshift(viewedProperty);
    
    // Keep only the last N properties
    const limitedProperties = filteredProperties.slice(0, this.MAX_VIEWED_PROPERTIES);
    
    this.saveViewedProperties(limitedProperties);
    this.updatePropertyPreferences(limitedProperties);
  }

  public getViewedProperties(): ViewedProperty[] {
    if (!this.consentService.canUsePreferencesCookies()) {
      return [];
    }

    const cookieData = this.cookieService.get(this.VIEWED_PROPERTIES_COOKIE);
    if (!cookieData) {
      return [];
    }

    try {
      return JSON.parse(cookieData);
    } catch (error) {
      console.error('Error parsing viewed properties cookie:', error);
      return [];
    }
  }

  public getUserLocation(): UserLocation | null {
    if (!this.consentService.canUsePreferencesCookies()) {
      return null;
    }

    const cookieData = this.cookieService.get(this.USER_LOCATION_COOKIE);
    if (!cookieData) {
      return null;
    }

    try {
      return JSON.parse(cookieData);
    } catch (error) {
      console.error('Error parsing user location cookie:', error);
      return null;
    }
  }

  public setUserLocation(location: UserLocation): void {
    if (!this.consentService.canUsePreferencesCookies()) {
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.COOKIE_EXPIRY_DAYS);

    this.cookieService.set(
      this.USER_LOCATION_COOKIE,
      JSON.stringify(location),
      expiryDate,
      '/'
    );
  }

  public requestGeolocation(): Promise<UserLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now()
          };

          // Try to get city/country from reverse geocoding
          try {
            const cityInfo = await this.reverseGeocode(location.latitude, location.longitude);
            if (cityInfo) {
              location.city = cityInfo.city;
              location.country = cityInfo.country;
            }
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
          }

          this.setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error);
          resolve(null);
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  }

  public getPropertyPreferences(): PropertyPreferences | null {
    if (!this.consentService.canUsePreferencesCookies()) {
      return null;
    }

    const cookieData = this.cookieService.get(this.PROPERTY_PREFERENCES_COOKIE);
    if (!cookieData) {
      return null;
    }

    try {
      return JSON.parse(cookieData);
    } catch (error) {
      console.error('Error parsing property preferences cookie:', error);
      return null;
    }
  }

  public clearTrackingData(): void {
    this.cookieService.delete(this.VIEWED_PROPERTIES_COOKIE, '/');
    this.cookieService.delete(this.USER_LOCATION_COOKIE, '/');
    this.cookieService.delete(this.PROPERTY_PREFERENCES_COOKIE, '/');
  }

  private saveViewedProperties(properties: ViewedProperty[]): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.COOKIE_EXPIRY_DAYS);

    this.cookieService.set(
      this.VIEWED_PROPERTIES_COOKIE,
      JSON.stringify(properties),
      expiryDate,
      '/'
    );
  }

  private updatePropertyPreferences(viewedProperties: ViewedProperty[]): void {
    if (viewedProperties.length === 0) {
      return;
    }

    // Analyze preferences from viewed properties
    const types = viewedProperties.map(p => p.type);
    const prices = viewedProperties.map(p => p.price);
    const locations = viewedProperties.map(p => p.location);
    const bedrooms = viewedProperties.map(p => p.bedrooms);
    const bathrooms = viewedProperties.map(p => p.bathrooms);

    // Calculate preferences
    const preferences: PropertyPreferences = {
      preferredTypes: this.getUniqueFrequent(types),
      priceRange: {
        min: Math.min(...prices) * 0.8, // 20% lower than minimum viewed
        max: Math.max(...prices) * 1.2  // 20% higher than maximum viewed
      },
      preferredLocations: this.getUniqueFrequent(locations),
      averageBedrooms: Math.round(bedrooms.reduce((a, b) => a + b, 0) / bedrooms.length),
      averageBathrooms: Math.round(bathrooms.reduce((a, b) => a + b, 0) / bathrooms.length)
    };

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.COOKIE_EXPIRY_DAYS);

    this.cookieService.set(
      this.PROPERTY_PREFERENCES_COOKIE,
      JSON.stringify(preferences),
      expiryDate,
      '/'
    );
  }

  private categorizeProperty(property: Property): string {
    // Categorize based on price and type
    if (property.pricing.price > 500000) {
      return 'luxury';
    } else if (property.pricing.price < 100000) {
      return 'budget';
    } else {
      return 'mid-range';
    }
  }

  private getUniqueFrequent<T>(array: T[]): T[] {
    const frequency: { [key: string]: number } = {};
    
    array.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 most frequent
      .map(([key]) => key as T);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<{city: string, country: string} | null> {
    try {
      // Using OpenStreetMap Nominatim (free alternative to Google)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
