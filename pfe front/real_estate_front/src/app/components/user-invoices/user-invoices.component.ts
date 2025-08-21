import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../interfaces/invoice.interface';

@Component({
  selector: 'app-user-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-invoices.component.html',
  styleUrls: ['./user-invoices.component.css']
})
export class UserInvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  // Add Math property to make it available in template
  Math = Math;

  constructor(
    private invoiceService: InvoiceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserInvoices();
  }

  loadUserInvoices(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.error = 'User not authenticated';
      return;
    }

    this.loading = true;
    this.error = null;
    
    this.invoiceService.getUserInvoices(currentUser.id, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoices = response.data.invoices;
            this.totalItems = response.data.total;
            this.totalPages = response.data.pages;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load invoices';
          this.loading = false;
          console.error('Error loading invoices:', error);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUserInvoices();
  }

  downloadPDF(invoiceId: string, invoiceNumber: string): void {
    this.invoiceService.downloadInvoicePDF(invoiceId)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
          this.error = 'Failed to download PDF';
        }
      });
  }

  uploadPDF(invoiceId: string, event: any): void {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      this.error = 'Please select a valid PDF file';
      return;
    }

    this.invoiceService.uploadInvoicePDF(invoiceId, file)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUserInvoices(); // Reload to show updated invoice
            // Reset file input
            event.target.value = '';
          }
        },
        error: (error) => {
          console.error('Error uploading PDF:', error);
          this.error = 'Failed to upload PDF';
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'sent': return 'status-sent';
      case 'overdue': return 'status-overdue';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}
