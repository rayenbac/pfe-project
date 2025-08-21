import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentInvoiceService, PaymentInvoice } from '../../../../core/services/payment-invoice.service';

@Component({
  selector: 'app-invoices-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoices-table.component.html',
  styleUrls: ['./invoices-table.component.css']
})
export class InvoicesTableComponent implements OnInit {
  invoices: PaymentInvoice[] = [];
  loading = false;
  selectedInvoice: PaymentInvoice | null = null;
  showModal = false;
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // Make Math available in template
  Math = Math;

  statusTypes = [
    { value: 'pending', label: 'Pending', class: 'warning' },
    { value: 'paid', label: 'Paid', class: 'success' },
    { value: 'cancelled', label: 'Cancelled', class: 'secondary' },
    { value: 'refunded', label: 'Refunded', class: 'info' }
  ];

  constructor(private paymentInvoiceService: PaymentInvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.paymentInvoiceService.getUserInvoices().subscribe({
      next: (invoices: PaymentInvoice[]) => {
        this.invoices = invoices.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load invoices', 'error');
        this.loading = false;
      }
    });
  }

  openInvoiceDetails(invoice: PaymentInvoice): void {
    this.selectedInvoice = invoice;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedInvoice = null;
  }

  payInvoice(invoice: PaymentInvoice): void {
    // Implement payment functionality
    this.showMessage('Payment processing feature coming soon', 'success');
  }

  downloadInvoice(invoice: PaymentInvoice): void {
    // Implement invoice download functionality
    this.showMessage('Download feature coming soon', 'success');
  }

  getStatusClass(status: string): string {
    const statusType = this.statusTypes.find(s => s.value === status);
    return statusType ? `badge-${statusType.class}` : 'badge-secondary';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  isOverdue(invoice: PaymentInvoice): boolean {
    return new Date(invoice.dueDate) < new Date() && invoice.status === 'pending';
  }

  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }
}