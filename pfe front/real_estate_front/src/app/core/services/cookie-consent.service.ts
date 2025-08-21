import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly CONSENT_COOKIE = 'cookie_consent';
  private readonly CONSENT_EXPIRY_DAYS = 365;
  
  private consentStatusSubject = new BehaviorSubject<CookiePreferences | null>(null);
  public consentStatus$ = this.consentStatusSubject.asObservable();

  constructor(private cookieService: CookieService) {
    this.loadConsentStatus();
  }

  private loadConsentStatus(): void {
    const consentData = this.cookieService.get(this.CONSENT_COOKIE);
    if (consentData) {
      try {
        const preferences = JSON.parse(consentData);
        this.consentStatusSubject.next(preferences);
      } catch (error) {
        console.error('Error parsing consent cookie:', error);
        this.consentStatusSubject.next(null);
      }
    }
  }

  public hasConsent(): boolean {
    return this.cookieService.check(this.CONSENT_COOKIE);
  }

  public getConsentStatus(): CookiePreferences | null {
    return this.consentStatusSubject.value;
  }

  public setConsent(preferences: CookiePreferences): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.CONSENT_EXPIRY_DAYS);
    
    this.cookieService.set(
      this.CONSENT_COOKIE,
      JSON.stringify(preferences),
      expiryDate,
      '/', // path
      undefined, // domain
      true, // secure
      'Strict' // sameSite
    );
    
    this.consentStatusSubject.next(preferences);
  }

  public canUseAnalyticsCookies(): boolean {
    const consent = this.getConsentStatus();
    return consent?.analytics === true;
  }

  public canUsePreferencesCookies(): boolean {
    const consent = this.getConsentStatus();
    return consent?.preferences === true;
  }

  public canUseMarketingCookies(): boolean {
    const consent = this.getConsentStatus();
    return consent?.marketing === true;
  }

  public revokeConsent(): void {
    this.cookieService.delete(this.CONSENT_COOKIE, '/');
    this.consentStatusSubject.next(null);
    
    // Clear other tracking cookies if consent is revoked
    this.clearTrackingCookies();
  }

  private clearTrackingCookies(): void {
    // Clear viewing history and location cookies
    this.cookieService.delete('viewed_properties', '/');
    this.cookieService.delete('user_location', '/');
    this.cookieService.delete('property_preferences', '/');
  }

  public showConsentBanner(): boolean {
    return !this.hasConsent();
  }
}
