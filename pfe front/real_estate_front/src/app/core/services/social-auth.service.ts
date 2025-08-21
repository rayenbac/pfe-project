import { Injectable } from '@angular/core';
import { SocialAuthService as AngularSocialAuthService, SocialUser, GoogleLoginProvider, FacebookLoginProvider } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomSocialAuthService {
  private userSubject = new BehaviorSubject<SocialUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private socialAuthService: AngularSocialAuthService,
    private http: HttpClient
  ) {
    this.socialAuthService.authState.subscribe((user) => {
      this.userSubject.next(user);
      if (user) {
        this.handleSocialLogin(user);
      }
    });
  }

  signInWithGoogle(): void {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  signInWithFacebook(): void {
    this.socialAuthService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.socialAuthService.signOut();
    this.userSubject.next(null);
  }

  private handleSocialLogin(user: SocialUser): void {
    const { provider, idToken, email, name, photoUrl } = user;
    
    this.http.post(`${environment.apiBaseUrl}/auth/social-login`, {
      provider,
      token: idToken,
      email,
      name,
      photoUrl
    }).subscribe({
      next: (response) => {
        // Handle successful login
        console.log('Social login successful:', response);
      },
      error: (error) => {
        console.error('Social login error:', error);
      }
    });
  }
} 