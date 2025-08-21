import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, InvoiceFilters, InvoiceStats, ApiResponse } from '../interfaces/invoice.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiBaseUrl}/invoices`;

  constructor(private http: HttpClient) { }

  // Create invoice from booking
  createInvoiceFromBooking(bookingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/${bookingId}`, {});
  }

  // Get user invoices
  getUserInvoices(userId: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(`${this.apiUrl}/user/${userId}`, { params });
  }

  // Get agent invoices
  getAgentInvoices(agentId: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(`${this.apiUrl}/agent/${agentId}`, { params });
  }

  // Get all invoices (admin)
  getAllInvoices(page: number = 1, limit: number = 10, filters?: InvoiceFilters): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.agentId) params = params.set('agentId', filters.agentId);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get(`${this.apiUrl}`, { params });
  }

  // Get invoice by ID
  getInvoiceById(invoiceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${invoiceId}`);
  }

  // Update invoice status
  updateInvoiceStatus(invoiceId: string, status: string, paymentDate?: Date): Observable<any> {
    const body: any = { status };
    if (paymentDate) {
      body.paymentDate = paymentDate;
    }
    return this.http.put(`${this.apiUrl}/${invoiceId}/status`, body);
  }

  // Upload invoice PDF
  uploadInvoicePDF(invoiceId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', file);
    return this.http.post(`${this.apiUrl}/${invoiceId}/upload-pdf`, formData);
  }

  // Generate invoice PDF
  generateInvoicePDF(invoiceId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${invoiceId}/generate-pdf`, {});
  }

  // Download invoice PDF
  downloadInvoicePDF(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/download`, { 
      responseType: 'blob' 
    });
  }

  // Get invoice statistics
  getInvoiceStatistics(): Observable<{ success: boolean; data: InvoiceStats }> {
    return this.http.get<{ success: boolean; data: InvoiceStats }>(`${this.apiUrl}/stats/overview`);
  }

  // Mark overdue invoices
  markOverdueInvoices(): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-overdue`, {});
  }
}
