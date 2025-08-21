import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  bookings: any[] = [];
  filteredBookings: any[] = [];
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
  paymentStatusFilter = '';

  constructor() {}

  ngOnInit() {
    this.loadBookings();
  }

  async loadBookings() {
    this.loading = true;
    this.error = null;
    
    try {
      // Simulate API call - replace with actual booking service
      const mockBookings = [
        {
          _id: '1',
          property: {
            _id: 'prop1',
            title: 'Luxury Villa in Dubai',
            images: ['/assets/images/property1.jpg']
          },
          tenant: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
          },
          owner: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com'
          },
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-07'),
          guestCount: 4,
          totalAmount: 1500,
          currency: 'USD',
          status: 'confirmed',
          paymentStatus: 'paid',
          reservationType: 'online',
          contactInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
          },
          metadata: {
            rentalDays: 6,
            pricePerDay: 250
          },
          createdAt: new Date('2024-01-15')
        },
        {
          _id: '2',
          property: {
            _id: 'prop2',
            title: 'Modern Apartment in Paris',
            images: ['/assets/images/property2.jpg']
          },
          tenant: {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            phone: '+9876543210'
          },
          owner: {
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'bob.wilson@example.com'
          },
          startDate: new Date('2024-02-10'),
          endDate: new Date('2024-02-15'),
          guestCount: 2,
          totalAmount: 1200,
          currency: 'EUR',
          status: 'pending',
          paymentStatus: 'pending',
          reservationType: 'offline',
          paymentDeadline: new Date('2024-01-25'),
          contactInfo: {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            phone: '+9876543210'
          },
          metadata: {
            rentalDays: 5,
            pricePerDay: 240
          },
          createdAt: new Date('2024-01-14')
        }
      ];
      
      this.bookings = mockBookings;
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load bookings';
      console.error('Error loading bookings:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.bookings];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.property?.title?.toLowerCase().includes(term) ||
        booking.tenant?.email?.toLowerCase().includes(term) ||
        booking.owner?.email?.toLowerCase().includes(term) ||
        booking.contactInfo?.firstName?.toLowerCase().includes(term) ||
        booking.contactInfo?.lastName?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(booking => booking.status === this.statusFilter);
    }

    // Payment status filter
    if (this.paymentStatusFilter) {
      filtered = filtered.filter(booking => booking.paymentStatus === this.paymentStatusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getNestedValue(a, this.sortField);
      const bValue = this.getNestedValue(b, this.sortField);
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredBookings = filtered;
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj) || '';
  }

  getPaginatedBookings() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredBookings.slice(start, end);
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

  trackByBookingId(index: number, booking: any): string {
    return booking._id;
  }

  getStatusClass(booking: any): string {
    switch (booking.status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-unknown';
    }
  }

  getPaymentStatusClass(booking: any): string {
    switch (booking.paymentStatus) {
      case 'paid': return 'payment-paid';
      case 'pending': return 'payment-pending';
      case 'failed': return 'payment-failed';
      case 'refunded': return 'payment-refunded';
      default: return 'payment-unknown';
    }
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  async updateBookingStatus(booking: any, newStatus: string) {
    if (confirm(`Are you sure you want to ${newStatus} this booking?`)) {
      try {
        // Implement booking status update logic
        console.log('Updating booking status:', booking._id, newStatus);
        booking.status = newStatus;
      } catch (error: any) {
        this.error = error.message || 'Failed to update booking status';
      }
    }
  }

  async deleteBooking(booking: any) {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        // Implement booking deletion logic
        console.log('Deleting booking:', booking._id);
        this.loadBookings();
      } catch (error: any) {
        this.error = error.message || 'Failed to delete booking';
      }
    }
  }

  getDateRange(booking: any): string {
    const start = new Date(booking.startDate).toLocaleDateString();
    const end = new Date(booking.endDate).toLocaleDateString();
    return `${start} - ${end}`;
  }

  getDuration(booking: any): string {
    const days = booking.metadata?.rentalDays || 0;
    return `${days} day${days !== 1 ? 's' : ''}`;
  }

  isOverdue(booking: any): boolean {
    if (booking.paymentDeadline && booking.paymentStatus === 'pending') {
      return new Date(booking.paymentDeadline) < new Date();
    }
    return false;
  }
}
