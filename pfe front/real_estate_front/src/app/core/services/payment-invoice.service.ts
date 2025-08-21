import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentInvoice {
  _id?: string;
  agentId: string;
  bookingId: string;
  propertyId: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  commission: number;
  commissionRate: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe' | 'konnect' | 'bank_transfer';
  paymentDate?: Date;
  paidDate?: Date;
  dueDate: Date;
  description: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
  booking?: any;
  property?: any;
  tenant?: any;
  contract?: {
    property: {
      title: string;
      address: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentInvoiceService {
  private apiUrl = `${environment.apiBaseUrl}/payment-invoices`;

  constructor(private http: HttpClient) {}

  // Get agent's invoices
  getAgentInvoices(agentId: string): Observable<PaymentInvoice[]> {
    return this.http.get<PaymentInvoice[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  // Get user's invoices (for both agents and tenants)
  getUserInvoices(): Observable<PaymentInvoice[]> {
    return this.http.get<PaymentInvoice[]>(`${this.apiUrl}/user`);
  }

  // Get invoice by ID
  getInvoiceById(invoiceId: string): Observable<PaymentInvoice> {
    return this.http.get<PaymentInvoice>(`${this.apiUrl}/${invoiceId}`);
  }

  // Create invoice
  createInvoice(invoice: Partial<PaymentInvoice>): Observable<PaymentInvoice> {
    return this.http.post<PaymentInvoice>(this.apiUrl, invoice);
  }

  // Update invoice status
  updateInvoiceStatus(invoiceId: string, status: string): Observable<PaymentInvoice> {
    return this.http.patch<PaymentInvoice>(`${this.apiUrl}/${invoiceId}/status`, { status });
  }

  // Generate invoice PDF
  generateInvoicePDF(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, { responseType: 'blob' });
  }

  // Get invoice statistics for agent
  getAgentInvoiceStats(agentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/agent/${agentId}/stats`);
  }

  // Send invoice reminder
  sendInvoiceReminder(invoiceId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${invoiceId}/reminder`, {});
  }
}
