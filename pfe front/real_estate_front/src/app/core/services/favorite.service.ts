import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property } from '../models/property.model';
import { Favorite } from '../models/favorite.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = `${environment.apiBaseUrl}/favorites`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Get all favorites for the current user
  getUserFavorites(): Observable<Property[]> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    return this.http.get<Property[]>(`${this.apiUrl}/user`);
  }

  // Add a property to favorites (works with backend: create favorite if needed, then add property)
  addToFavorites(propertyId: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return new Observable(observer => {
      this.http.get<any[]>(`${this.apiUrl}/user/${user._id}`).subscribe({
        next: (favorites) => {
          let favoriteId: string;
          if (favorites && favorites.length > 0) {
            favoriteId = favorites[0]._id;
            this.http.put<any>(`${this.apiUrl}/${favoriteId}/property`, { propertyId }).subscribe(observer);
          } else {
            this.http.post<any>(this.apiUrl, { name: 'Favorites', userId: user._id }).subscribe({
              next: (newFavorite) => {
                favoriteId = newFavorite._id;
                this.http.put<any>(`${this.apiUrl}/${favoriteId}/property`, { propertyId }).subscribe(observer);
              },
              error: (err) => observer.error(err)
            });
          }
        },
        error: (err) => {
          // If 404, treat as no favorites, so create one
          if (err.status === 404) {
            this.http.post<any>(this.apiUrl, { name: 'Favorites', userId: user._id }).subscribe({
              next: (newFavorite) => {
                const favoriteId = newFavorite._id;
                this.http.put<any>(`${this.apiUrl}/${favoriteId}/property`, { propertyId }).subscribe(observer);
              },
              error: (err2) => observer.error(err2)
            });
          } else {
            observer.error(err);
          }
        }
      });
    });
  }

  // Remove a property from favorites
  removeFromFavorites(propertyId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/property/${propertyId}`);
  }

  // Check if a property is in favorites
  checkFavorite(propertyId: string): Observable<{ isFavorite: boolean }> {
    return this.http.get<{ isFavorite: boolean }>(`${this.apiUrl}/check/${propertyId}`);
  }

  // Create a new favorite list
  createFavoriteList(name: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/list`, { name });
  }

  // Get all favorite lists for the current user
  getUserFavoriteLists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/lists`);
  }

  // Add a property to a specific favorite list
  addToFavoriteList(listId: string, propertyId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/list/${listId}/property`, { propertyId });
  }

  // Remove a property from a specific favorite list
  removeFromFavoriteList(listId: string, propertyId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/list/${listId}/property/${propertyId}`);
  }

  // Universal favorite methods
  
  // Get all favorites for a user
  getAllUserFavorites(userId?: string): Observable<Favorite[]> {
    const user = userId ? { _id: userId } : this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return this.http.get<Favorite[]>(`${this.apiUrl}/user/${user._id}/all`);
  }

  // Get favorites by entity type for a user
  getUserFavoritesByType(entityType: string, userId?: string): Observable<Favorite[]> {
    const user = userId ? { _id: userId } : this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return this.http.get<Favorite[]>(`${this.apiUrl}/user/${user._id}/${entityType}`);
  }

  // Add a universal favorite
  addUniversalFavorite(favorite: Favorite): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.apiUrl}/universal`, favorite, this.getHttpOptions());
  }

  // Helper method to get HTTP options
  private getHttpOptions() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return { headers };
  }

  // Remove a universal favorite
  removeFavoriteByEntity(entityType: string, entityId: string, userId?: string): Observable<void> {
    const user = userId ? { _id: userId } : this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return this.http.delete<void>(`${this.apiUrl}/user/${user._id}/${entityType}/${entityId}`);
  }

  // Check if an entity is favorited by user
  isFavorited(entityType: string, entityId: string, userId?: string): Observable<boolean> {
    const user = userId ? { _id: userId } : this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return this.http.get<boolean>(`${this.apiUrl}/check/${user._id}/${entityType}/${entityId}`);
  }

  // Toggle favorite status
  toggleFavorite(entityType: string, entityId: string, entityData?: any, userId?: string): Observable<{ isFavorited: boolean; favorite?: Favorite }> {
    const user = userId ? { _id: userId } : this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const payload = {
      userId: user._id,
      entityType,
      entityId,
      ...entityData
    };
    return this.http.post<{ isFavorited: boolean; favorite?: Favorite }>(`${this.apiUrl}/toggle`, payload, this.getHttpOptions());
  }

  // Entity-specific favorite methods
  addAgentFavorite(agentId: string, notes?: string): Observable<Favorite> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const favorite: Favorite = {
      userId: user._id,
      entityType: 'agent',
      entityId: agentId,
      notes
    };
    return this.addUniversalFavorite(favorite);
  }

  addAgencyFavorite(agencyId: string, notes?: string): Observable<Favorite> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const favorite: Favorite = {
      userId: user._id,
      entityType: 'agency',
      entityId: agencyId,
      notes
    };
    return this.addUniversalFavorite(favorite);
  }

  addPostFavorite(postId: string, notes?: string): Observable<Favorite> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const favorite: Favorite = {
      userId: user._id,
      entityType: 'post',
      entityId: postId,
      notes
    };
    return this.addUniversalFavorite(favorite);
  }
}