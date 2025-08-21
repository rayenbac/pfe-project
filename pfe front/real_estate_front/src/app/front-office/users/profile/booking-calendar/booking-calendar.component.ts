import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../../core/services/booking.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Booking, BookingWithProperty } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.css']
})
export class BookingCalendarComponent implements OnInit {
  bookings: BookingWithProperty[] = [];
  loading = false;
  selectedBooking: BookingWithProperty | null = null;
  showModal = false;
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  statusTypes = [
    { value: 'pending', label: 'Pending', class: 'warning' },
    { value: 'confirmed', label: 'Confirmed', class: 'success' },
    { value: 'cancelled', label: 'Cancelled', class: 'danger' },
    { value: 'completed', label: 'Completed', class: 'info' }
  ];

  constructor(
    private bookingService: BookingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser._id) {
      this.showMessage('User not authenticated', 'error');
      this.loading = false;
      return;
    }
    
    this.bookingService.getUserReservations(currentUser._id).subscribe({
      next: (bookings: BookingWithProperty[]) => {
        this.bookings = bookings.sort((a, b) => 
          new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime()
        );
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading bookings:', error);
        this.showMessage('Failed to load bookings', 'error');
        this.loading = false;
      }
    });
  }

  openBookingDetails(booking: BookingWithProperty): void {
    this.selectedBooking = booking;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBooking = null;
  }

  updateBookingStatus(booking: BookingWithProperty, status: string): void {
    if (!booking._id) return;
    
    this.bookingService.updateBookingStatus(booking._id, status).subscribe({
      next: (updatedBooking: Booking) => {
        const index = this.bookings.findIndex(b => b._id === booking._id);
        if (index !== -1) {
          // Update only the basic booking fields, preserve the populated property
          this.bookings[index] = { 
            ...this.bookings[index], 
            status: updatedBooking.status,
            paymentStatus: updatedBooking.paymentStatus,
            updatedAt: updatedBooking.updatedAt
          };
        }
        this.showMessage('Booking status updated', 'success');
        this.closeModal();
      },
      error: (error: any) => {
        this.showMessage('Failed to update booking status', 'error');
      }
    });
  }

  cancelBooking(booking: BookingWithProperty): void {
    if (!booking._id) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    this.bookingService.cancelBooking(booking._id).subscribe({
      next: (updatedBooking: Booking) => {
        const index = this.bookings.findIndex(b => b._id === booking._id);
        if (index !== -1) {
          // Update only the basic booking fields, preserve the populated property
          this.bookings[index] = { 
            ...this.bookings[index], 
            status: updatedBooking.status,
            paymentStatus: updatedBooking.paymentStatus,
            updatedAt: updatedBooking.updatedAt
          };
        }
        this.showMessage('Booking cancelled successfully', 'success');
        this.closeModal();
      },
      error: (error: any) => {
        this.showMessage('Failed to cancel booking', 'error');
      }
    });
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

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  }

  getDaysBetween(startDate: Date | string | undefined, endDate: Date | string | undefined): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 3000);
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  isUpcoming(booking: BookingWithProperty): boolean {
    return new Date(booking.startDate) > new Date();
  }

  isActive(booking: BookingWithProperty): boolean {
    const now = new Date();
    return new Date(booking.startDate) <= now && new Date(booking.endDate) >= now;
  }

  isPast(booking: BookingWithProperty): boolean {
    return new Date(booking.endDate) < new Date();
  }

  canCancel(booking: BookingWithProperty): boolean {
    return booking.status === 'pending' || booking.status === 'confirmed';
  }

  canUpdate(booking: BookingWithProperty): boolean {
    return booking.status !== 'cancelled' && booking.status !== 'completed';
  }

  getPaymentStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'warning',
      'paid': 'success',
      'failed': 'danger',
      'refunded': 'info'
    };
    return `badge-${statusMap[status] || 'secondary'}`;
  }
}
