import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Property } from '../models/property.model';
import { environment } from '../../../environments/environment';

export interface Recommendation {
  property_id: string;
  score: number;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  property?: Property;
}

export interface RecommendationResponse {
  user_id: string;
  type: string;
  recommendations: Recommendation[];
  total_count: number;
}

export interface SimilarProperty {
  property_id: string;
  similarity_score: number;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  property?: Property;
}

export interface SimilarPropertiesResponse {
  property_id?: string;
  similar_properties: SimilarProperty[];
  total_count?: number;
  message?: string;
}

export interface UserPreferences {
  user_id: string;
  preferences: {
    favorite_types: { [key: string]: number };
    favorite_locations: { [key: string]: number };
    avg_price_range: {
      min: number;
      max: number;
      avg: number;
    };
    bedroom_preference: number;
    bathroom_preference: number;
    avg_rating: number;
    interaction_count: number;
  };
}

export interface TrendingProperty {
  property_id: string;
  trending_score: number;
  avg_rating: number;
  interaction_count: number;
  views?: number;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  property?: Property;
}

export interface TrendingPropertiesResponse {
  trending_properties: TrendingProperty[];
  total_count: number;
}

@Injectable({ providedIn: 'root' })
export class RecommenderService {
  private apiUrl = `${environment.apiBaseUrl}/recommender`;

  constructor(private http: HttpClient) {}

  getRecommendations(userId: string, type: string = 'hybrid', n: number = 5): Observable<RecommendationResponse> {
    let params = new HttpParams()
      .set('user_id', userId)
      .set('type', type)
      .set('n', n.toString());
    
    return this.http.get<RecommendationResponse>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getRecommendationsWithDetails(userId: string, type: string = 'hybrid', n: number = 5): Observable<RecommendationResponse> {
    let params = new HttpParams()
      .set('user_id', userId)
      .set('type', type)
      .set('n', n.toString());
    
    return this.http.get<RecommendationResponse>(`${this.apiUrl}/detailed`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getSimilarProperties(propertyId: string, n: number = 5): Observable<SimilarPropertiesResponse> {
    let params = new HttpParams()
      .set('property_id', propertyId)
      .set('n', n.toString());
    
    return this.http.get<SimilarPropertiesResponse>(`${this.apiUrl}/similar`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getSimilarPropertiesWithDetails(propertyId: string, n: number = 5): Observable<SimilarPropertiesResponse> {
    let params = new HttpParams()
      .set('property_id', propertyId)
      .set('n', n.toString());
    
    return this.http.get<SimilarPropertiesResponse>(`${this.apiUrl}/similar/detailed`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserPreferences(userId: string): Observable<UserPreferences> {
    let params = new HttpParams()
      .set('user_id', userId);
    
    return this.http.get<UserPreferences>(`${this.apiUrl}/preferences`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getTrendingProperties(n: number = 10): Observable<TrendingPropertiesResponse> {
    let params = new HttpParams()
      .set('n', n.toString());
    
    return this.http.get<TrendingPropertiesResponse>(`${this.apiUrl}/trending`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getContentBasedRecommendations(userId: string, n: number = 5): Observable<RecommendationResponse> {
    let params = new HttpParams()
      .set('user_id', userId)
      .set('n', n.toString());
    
    return this.http.get<RecommendationResponse>(`${this.apiUrl}/content-based`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Helper method for homepage recommendations
  getHomepageRecommendations(userId: string): Observable<{
    personalizedRecommendations: Recommendation[];
    trendingProperties: TrendingProperty[];
  }> {
    const personalized$ = this.getRecommendationsWithDetails(userId, 'hybrid', 6);
    const trending$ = this.getTrendingProperties(6);

    return this.http.get<any>(`${this.apiUrl}/homepage`, {
      params: new HttpParams().set('user_id', userId)
    }).pipe(
      catchError(() => {
        // Fallback to separate calls if endpoint doesn't exist
        return Promise.all([
          personalized$.toPromise(),
          trending$.toPromise()
        ]).then(([personalizedResponse, trendingResponse]) => ({
          personalizedRecommendations: personalizedResponse?.recommendations || [],
          trendingProperties: trendingResponse?.trending_properties || []
        }));
      })
    );
  }

  // Helper method to track user interactions for better recommendations
  trackUserInteraction(userId: string, propertyId: string, interactionType: 'view' | 'favorite' | 'contact', rating?: number): Observable<any> {
    const payload = {
      user_id: userId,
      property_id: propertyId,
      interaction_type: interactionType,
      rating: rating || null,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.apiUrl}/interaction`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Guest user recommendations based on cookie data
  getGuestRecommendations(guestData: {
    preferences?: any;
    viewedProperties?: any[];
    userLocation?: any;
    limit: number;
  }): Observable<RecommendationResponse> {
    return this.http.post<RecommendationResponse>(`${this.apiUrl}/guest`, guestData)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('RecommenderService error:', error);
    
    let errorMessage = 'An error occurred while fetching recommendations';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 