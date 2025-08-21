import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice, InvoiceFilters } from '../../../interfaces/invoice.interface';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  
  // Filters
  filters: InvoiceFilters = {};
  statusOptions = ['sent', 'paid', 'overdue', 'cancelled'];
  
  // Search
  searchTerm = '';
  
  // Make Math available to template
  Math = Math;
  
  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = null;
    
    this.invoiceService.getAllInvoices(this.currentPage, this.pageSize, this.filters)
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
    this.loadInvoices();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadInvoices();
  }

  clearFilters(): void {
    this.filters = {};
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadInvoices();
  }

  updateInvoiceStatus(invoiceId: string, status: string): void {
    const paymentDate = status === 'paid' ? new Date() : undefined;
    
    this.invoiceService.updateInvoiceStatus(invoiceId, status, paymentDate)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadInvoices(); // Reload to get updated data
          }
        },
        error: (error) => {
          console.error('Error updating invoice status:', error);
          this.error = 'Failed to update invoice status';
        }
      });
  }

  generatePDF(invoiceId: string): void {
    this.invoiceService.generateInvoicePDF(invoiceId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Refresh the invoice to show the new PDF URL
            this.loadInvoices();
          }
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          this.error = 'Failed to generate PDF';
        }
      });
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'sent': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-secondary';
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
