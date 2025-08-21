import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvailabilityCalendar, DateAvailabilityResponse, Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private apiUrl = environment.apiBaseUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getPropertyAvailability(propertyId: string, month: number, year: number): Observable<AvailabilityCalendar[]> {
    return this.http.get<AvailabilityCalendar[]>(
      `${this.apiUrl}/bookings/properties/${propertyId}/availability?month=${month}&year=${year}`
    );
  }

  checkDateAvailability(propertyId: string, startDate: string, endDate: string): Observable<DateAvailabilityResponse> {
    return this.http.post<DateAvailabilityResponse>(
      `${this.apiUrl}/bookings/properties/${propertyId}/check-availability`,
      { startDate, endDate }
    );
  }

  createBooking(booking: Booking): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/bookings`, booking);
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings/user/${userId}`);
  }

  getBookingById(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/bookings/${bookingId}`);
  }

  updateBookingStatus(bookingId: string, status: string, paymentStatus?: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/bookings/${bookingId}/status`, {
      status,
      paymentStatus
    });
  }

  cancelBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/bookings/${bookingId}/cancel`, {});
  }
}
