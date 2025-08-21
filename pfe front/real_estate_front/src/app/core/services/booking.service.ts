import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, BookingWithProperty } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiBaseUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // Get user's bookings (as tenant or owner)
  getUserBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Get user's bookings as tenant only (with populated property details)
  getUserReservations(userId: string): Observable<BookingWithProperty[]> {
    return this.http.get<BookingWithProperty[]>(`${this.apiUrl}/user/${userId}/reservations?populate=property`);
  }

  // Get booking by ID
  getBookingById(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${bookingId}`);
  }

  // Update booking status
  updateBookingStatus(bookingId: string, status: string, paymentStatus?: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${bookingId}/status`, {
      status,
      paymentStatus
    });
  }

  // Cancel booking
  cancelBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${bookingId}/cancel`, {});
  }

  // Get calendar data for user's bookings
  getUserBookingCalendar(userId: string, year?: number): Observable<any[]> {
    const params = year ? `?year=${year}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}/calendar${params}`);
  }

  // Get agent's property bookings
  getAgentBookings(agentId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/agent/${agentId}`);
  }
}
