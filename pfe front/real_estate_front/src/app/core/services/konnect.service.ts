import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KonnectPaymentRequest, KonnectPaymentResponse } from '../models/konnect-payment.model';

@Injectable({ providedIn: 'root' })
export class KonnectService {
  private apiUrl = environment.apiBaseUrl + '/konnect';

  constructor(private http: HttpClient) {}

  createPayment(data: KonnectPaymentRequest): Observable<KonnectPaymentResponse> {
    return this.http.post<KonnectPaymentResponse>(`${this.apiUrl}/create-payment`, data);
  }

  getPaymentDetails(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/details/${paymentId}`);
  }

  // Enhanced methods for better payment flow handling
  checkPaymentStatus(paymentRef: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/status/${paymentRef}`);
  }

  handlePaymentCallback(paymentRef: string, status: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/callback`, { paymentRef, status });
  }

  // Convert amount to TND with exchange rate
  convertToTND(amount: number, fromCurrency: string, exchangeRates: any): number {
    if (fromCurrency === 'TND') return amount;
    const rate = exchangeRates['TND'] || 1;
    return +(amount * rate).toFixed(2);
  }

  // Format amount for display
  formatAmount(amount: number, currency: string = 'TND'): string {
    return `${currency} ${amount.toFixed(2)}`;
  }
} 