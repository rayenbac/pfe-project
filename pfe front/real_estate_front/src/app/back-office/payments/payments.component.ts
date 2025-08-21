import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  payments: any[] = [];
  filteredPayments: any[] = [];
  loading = false;
  error: string | null = null;

  // Make Math available in template
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  statusFilter = '';
  typeFilter = '';
  dateFilter = '';

  constructor() {}

  ngOnInit() {
    this.loadPayments();
  }

  async loadPayments() {
    this.loading = true;
    this.error = null;
    
    try {
      // Simulate API call - replace with actual payment service
      const mockPayments = [
        {
          _id: '1',
          transactionId: 'TXN-001',
          bookingId: 'BK-001',
          amount: 1500,
          currency: 'USD',
          status: 'completed',
          type: 'booking',
          paymentMethod: 'stripe',
          user: { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' },
          property: { title: 'Luxury Villa in Dubai' },
          createdAt: new Date('2024-01-15'),
          metadata: {
            stripeSessionId: 'cs_test_123',
            paymentIntentId: 'pi_test_123'
          }
        },
        {
          _id: '2',
          transactionId: 'TXN-002',
          bookingId: 'BK-002',
          amount: 2300,
          currency: 'EUR',
          status: 'pending',
          type: 'booking',
          paymentMethod: 'konnect',
          user: { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' },
          property: { title: 'Modern Apartment in Paris' },
          createdAt: new Date('2024-01-14'),
          metadata: {
            konnectPaymentId: 'kp_test_456'
          }
        },
        {
          _id: '3',
          transactionId: 'TXN-003',
          amount: 850,
          currency: 'USD',
          status: 'failed',
          type: 'commission',
          paymentMethod: 'stripe',
          agent: { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@example.com' },
          createdAt: new Date('2024-01-13'),
          description: 'Agent commission payment'
        }
      ];
      
      this.payments = mockPayments;
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load payments';
      console.error('Error loading payments:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.payments];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.transactionId?.toLowerCase().includes(term) ||
        payment.bookingId?.toLowerCase().includes(term) ||
        payment.user?.email?.toLowerCase().includes(term) ||
        payment.agent?.email?.toLowerCase().includes(term) ||
        payment.property?.title?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(payment => payment.status === this.statusFilter);
    }

    // Type filter
    if (this.typeFilter) {
      filtered = filtered.filter(payment => payment.type === this.typeFilter);
    }

    // Date filter
    if (this.dateFilter) {
      const today = new Date();
      const filterDate = new Date();
      
      switch (this.dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(payment => 
            new Date(payment.createdAt) >= filterDate
          );
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getNestedValue(a, this.sortField);
      const bValue = this.getNestedValue(b, this.sortField);
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredPayments = filtered;
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj) || '';
  }

  getPaginatedPayments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPayments.slice(start, end);
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByPaymentId(index: number, payment: any): string {
    return payment._id;
  }

  getStatusClass(payment: any): string {
    switch (payment.status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'refunded': return 'status-refunded';
      default: return 'status-unknown';
    }
  }

  getTypeClass(payment: any): string {
    switch (payment.type) {
      case 'booking': return 'type-booking';
      case 'commission': return 'type-commission';
      case 'refund': return 'type-refund';
      default: return 'type-other';
    }
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  async refundPayment(payment: any) {
    if (confirm('Are you sure you want to refund this payment?')) {
      try {
        // Implement refund logic
        console.log('Refunding payment:', payment._id);
        payment.status = 'refunded';
      } catch (error: any) {
        this.error = error.message || 'Failed to refund payment';
      }
    }
  }

  exportPayments() {
    // Implement export functionality
    console.log('Exporting payments...');
  }

  getTotalAmount(): number {
    return this.filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }

  getCompletedCount(): number {
    return this.filteredPayments.filter(p => p.status === 'completed').length;
  }

  getPendingCount(): number {
    return this.filteredPayments.filter(p => p.status === 'pending').length;
  }

  getFailedCount(): number {
    return this.filteredPayments.filter(p => p.status === 'failed').length;
  }
}
