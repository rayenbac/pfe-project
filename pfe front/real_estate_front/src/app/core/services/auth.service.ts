import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { jwtDecode } from "jwt-decode"; 

interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

interface JwtPayload {
  exp: number;
  userId: string;
  email: string;
  role: string;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  register(firstName: string, lastName: string, email: string, password: string, phone?: string, role?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { 
      firstName, 
      lastName, 
      email, 
      password,
      phone,
      role
    });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  forgotPassword(email: string, frontendUrl: string = window.location.origin): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email, frontendUrl });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found');
      return null;
    }
    return token;
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.exp) {
        return false;
      }
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  handleAuthError(): void {
    this.logout();
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResult.token);
    localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  googleLogin(idToken: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/google-login`, { idToken }).pipe(
      tap(response => {
        this.setSession(response as AuthResponse);
      })
    );
  }

  updateCurrentUserFromToken(token: string): void {
    try {
      const decoded: any = jwtDecode(token);
      const user: User = {
        _id: decoded.userId,
        firstName: decoded.firstName || '',
        lastName: decoded.lastName || '',
        name: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim() || 'User',
        email: decoded.email,
        password: '',
        phone: '',
        role: decoded.role,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.updateCurrentUser(user);
    } catch (e) {
      this.logout();
    }
  }
}