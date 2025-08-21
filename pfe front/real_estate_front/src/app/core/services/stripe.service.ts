import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl = `${environment.apiBaseUrl}/stripe`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // Create a payment intent
  createPaymentIntent(data: {
    propertyId: string;
    userId: string;
    agentId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Observable<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    return this.http.post<{
      clientSecret: string;
      paymentIntentId: string;
    }>(`${this.apiUrl}/create-payment-intent`, data, this.getHttpOptions());
  }

  // Confirm a payment
  confirmPayment(paymentIntentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirm-payment`, { paymentIntentId }, this.getHttpOptions());
  }

  // Get payments by user
  getPaymentsByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, this.getHttpOptions());
  }

  // Get payments by property
  getPaymentsByProperty(propertyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/property/${propertyId}`, this.getHttpOptions());
  }

  // Get payments by agent
  getPaymentsByAgent(agentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agent/${agentId}`, this.getHttpOptions());
  }

  // Process a refund
  processRefund(paymentIntentId: string, amount?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refund`, { paymentIntentId, amount }, this.getHttpOptions());
  }

  // Create a Connect account for an agent
  createConnectAccount(agentId: string, email: string): Observable<{ accountId: string }> {
    return this.http.post<{ accountId: string }>(`${this.apiUrl}/connect-account`, { agentId, email }, this.getHttpOptions());
  }

  // Create an account link for onboarding
  createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/account-link`, { accountId, refreshUrl, returnUrl }, this.getHttpOptions());
  }

  // Create a checkout session
  createCheckoutSession(data: {
    propertyId: string;
    userId: string;
    agentId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Observable<{ url: string }> {
    // Ensure URLs are absolute with scheme
    let origin = window.location.origin;
    let successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    let cancelUrl = `${origin}/payment/cancel`;
    // Fallback in case origin is missing (should not happen in browser)
    if (!/^https?:\/\//.test(successUrl)) {
      successUrl = `http://${successUrl}`;
    }
    if (!/^https?:\/\//.test(cancelUrl)) {
      cancelUrl = `http://${cancelUrl}`;
    }
    return this.http.post<{ url: string }>(
      `${this.apiUrl}/create-checkout-session`, 
      {
        ...data,
        successUrl,
        cancelUrl,
      },
      this.getHttpOptions() // Add the auth headers
    );
  }

  // Fetch payment details by Stripe session_id
  getPaymentBySessionId(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`, this.getHttpOptions());
  }
}
