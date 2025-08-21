import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/users`; // Replace with your API base URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all users
  getUsers(): Observable<User[]> {
    console.log('Fetching users from API...');
    return this.http.get<User[]>(this.apiUrl);
  }

  // Get a single user by ID
  getUser(id: string): Observable<User> {
    console.log(`Fetching user with ID: ${id}`);
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Get current user profile
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, this.getHttpOptions());
  }

  // Add a new user
  addUser(user: User): Observable<User> {
    console.log('Adding new user:', user);
    return this.http.post<User>(this.apiUrl, user, this.getHttpOptions());
  }

  // Update a user
  updateUser(id: string, data: User | FormData): Observable<User> {
    console.log(`Updating user with ID: ${id}`, data);
    
    // If data is FormData, don't set Content-Type header (browser will set it automatically with boundary)
    if (data instanceof FormData) {
      const token = this.authService.getToken();
      const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
      return this.http.put<User>(`${this.apiUrl}/${id}`, data, { headers });
    }
    
    // If data is User object, use JSON content type
    return this.http.put<User>(`${this.apiUrl}/${id}`, data, this.getHttpOptions());
  }

  // Delete a user
  deleteUser(id: string): Observable<void> {
    console.log(`Deleting user with ID: ${id}`);
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  // Get agents
  getAgents(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/agents`);
  }

  // Get agent by slug (name-based URL)
  getAgentBySlug(slug: string): Observable<User> {
    console.log(`Fetching agent with slug: ${slug}`);
    return this.http.get<User>(`${this.apiUrl}/agents/slug/${slug}`);
  }

  // Update user profile
  updateProfile(data: any): Observable<User> {
    console.log('Updating user profile:', data);
    return this.http.put<User>(`${this.apiUrl}/profile`, data, this.getHttpOptions());
  }

  // Upload avatar
  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Get the current user to extract the user ID
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser._id) {
      throw new Error('No current user found');
    }
    
    console.log('Using user ID for profile update:', currentUser._id);
    
    // Use the standard user update endpoint with the user ID
    // Don't set Content-Type header for FormData - let browser set it with boundary
    // Auth interceptor will add authorization header
    return this.http.put<User>(`${this.apiUrl}/${currentUser._id}`, formData);
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const payload = { currentPassword, newPassword };
    return this.http.post<any>(`${this.apiUrl}/change-password`, payload, this.getHttpOptions());
  }

  // Helper method to get common HTTP options, such as authorization headers
  private getHttpOptions() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  // Helper method to get auth headers only (for FormData requests)
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }
}
