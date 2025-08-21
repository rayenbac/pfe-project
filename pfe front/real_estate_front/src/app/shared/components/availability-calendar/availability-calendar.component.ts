import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../../../core/services/availability.service';
import { AvailabilityCalendar } from '../../../core/models/booking.model';

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './availability-calendar.component.html',
  styleUrls: ['./availability-calendar.component.css']
})
export class AvailabilityCalendarComponent implements OnInit, OnChanges {
  @Input() propertyId: string = '';
  @Input() selectedStartDate: string | null = null;
  @Input() selectedEndDate: string | null = null;
  @Input() selectionMode: 'range' | 'individual' = 'range';

  @Output() dateRangeSelected = new EventEmitter<{startDate: string, endDate: string, nights: number}>();
  @Output() dateRangeCleared = new EventEmitter<void>();
  @Output() individualDatesSelected = new EventEmitter<string[]>();

  calendarDays: (AvailabilityCalendar | null)[][] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  loading = false;
  error: string | null = null;
  
  selectedDates: string[] = [];
  hoverDate: string | null = null;
  
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit() {
    this.loadCalendar();
    
    // Auto-refresh calendar every 30 seconds to show updated bookings
    setInterval(() => {
      this.loadCalendar();
    }, 30000);

    // Listen for storage events to detect when bookings are created in other tabs/windows
    window.addEventListener('storage', (e) => {
      if (e.key === 'booking_created' || e.key === 'calendar_refresh_needed') {
        console.log('Calendar refresh triggered by storage event:', e.key);
        this.loadCalendar();
        if (e.key === 'booking_created') {
          localStorage.removeItem('booking_created');
        }
        if (e.key === 'calendar_refresh_needed') {
          const propertyId = localStorage.getItem('calendar_refresh_needed');
          if (propertyId === this.propertyId) {
            localStorage.removeItem('calendar_refresh_needed');
          }
        }
      }
    });

    // Listen for custom booking created events
    window.addEventListener('bookingCreated', (e: any) => {
      console.log('Calendar refresh triggered by custom event:', e.detail);
      if (e.detail?.propertyId === this.propertyId) {
        console.log('Refreshing calendar for property:', this.propertyId);
        this.loadCalendar();
      }
    });

    // Listen for visibility change to refresh when tab becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.propertyId) {
        console.log('Tab became visible, refreshing calendar');
        this.loadCalendar();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['propertyId'] && this.propertyId) {
      this.loadCalendar();
    }
  }

  refreshCalendar() {
    this.loadCalendar();
  }

  loadCalendar() {
    if (!this.propertyId) return;
    
    this.loading = true;
    this.error = null;
    
    console.log(`Loading calendar for property: ${this.propertyId}, month: ${this.currentMonth + 1}, year: ${this.currentYear}`);
    
    this.availabilityService.getPropertyAvailability(this.propertyId, this.currentMonth + 1, this.currentYear)
      .subscribe({
        next: (availability) => {
          console.log('Calendar availability data received:', availability);
          this.generateCalendar(availability);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load availability';
          this.loading = false;
          console.error('Error loading availability:', error);
        }
      });
  }

  generateCalendar(availability: AvailabilityCalendar[]) {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];
    let week: (AvailabilityCalendar | null)[] = [];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateStr = this.formatDate(currentDate);
      const dayAvailability = availability.find(a => a.date === dateStr);
      
      if (currentDate.getMonth() === this.currentMonth) {
        week.push(dayAvailability || {
          date: dateStr,
          available: true,
          price: 0,
          booked: false,
          blocked: false
        });
      } else {
        week.push(null);
      }

      if (week.length === 7) {
        this.calendarDays.push(week);
        week = [];
      }
    }
  }

  onDateClick(day: AvailabilityCalendar | null) {
    if (!day || !day.available || day.blocked) return;

    const clickedDate = day.date;

    if (this.selectionMode === 'individual') {
      this.handleIndividualDateSelection(clickedDate);
    } else {
      this.handleRangeSelection(clickedDate);
    }
  }

  private handleIndividualDateSelection(clickedDate: string) {
    const dateIndex = this.selectedDates.indexOf(clickedDate);
    
    if (dateIndex > -1) {
      // Date is already selected, remove it
      this.selectedDates.splice(dateIndex, 1);
    } else {
      // Date is not selected, check if we can add it
      if (this.canSelectDate(clickedDate)) {
        this.selectedDates.push(clickedDate);
        this.selectedDates.sort(); // Keep dates sorted
      } else {
        // Show error message about gap restriction
        console.warn('Cannot select date: would create a gap of 1-2 days between selected dates');
        return;
      }
    }
    
    // Emit the updated selection
    this.individualDatesSelected.emit([...this.selectedDates]);
  }

  private handleRangeSelection(clickedDate: string) {
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      // First click or restart selection
      this.selectedStartDate = clickedDate;
      this.selectedEndDate = null;
      this.dateRangeCleared.emit();
    } else if (this.selectedStartDate && !this.selectedEndDate) {
      // Second click
      const startDate = new Date(this.selectedStartDate);
      const endDate = new Date(clickedDate);
      
      if (endDate > startDate) {
        this.selectedEndDate = clickedDate;
        const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        this.dateRangeSelected.emit({
          startDate: this.selectedStartDate,
          endDate: this.selectedEndDate,
          nights: nights
        });
      } else {
        // End date is before or same as start date, restart selection
        this.selectedStartDate = clickedDate;
        this.selectedEndDate = null;
      }
    }
  }

  canSelectDate(clickedDate: string): boolean {
    if (this.selectedDates.length === 0) return true;
    
    const clickedDateTime = new Date(clickedDate).getTime();
    const sortedDates = [...this.selectedDates].sort();
    
    // Check for gaps before and after the clicked date
    for (const selectedDate of sortedDates) {
      const selectedDateTime = new Date(selectedDate).getTime();
      const daysDiff = Math.abs((clickedDateTime - selectedDateTime) / (1000 * 60 * 60 * 24));
      
      // If there's exactly 2 or 3 days difference, check if there are dates in between
      if (daysDiff === 2 || daysDiff === 3) {
        const hasGap = this.hasGapBetween(selectedDate, clickedDate);
        if (hasGap) return false;
      }
    }
    
    return true;
  }

  private hasGapBetween(date1: string, date2: string): boolean {
    const start = new Date(Math.min(new Date(date1).getTime(), new Date(date2).getTime()));
    const end = new Date(Math.max(new Date(date1).getTime(), new Date(date2).getTime()));
    
    const current = new Date(start);
    current.setDate(current.getDate() + 1);
    
    while (current < end) {
      const dateStr = this.formatDate(current);
      if (!this.selectedDates.includes(dateStr)) {
        return true; // Found a gap
      }
      current.setDate(current.getDate() + 1);
    }
    
    return false; // No gap found
  }

  onDateHover(day: AvailabilityCalendar | null) {
    if (!day || !day.available || day.blocked) return;
    this.hoverDate = day.date;
  }

  isDateInRange(date: string): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;
    
    const currentDate = new Date(date);
    const startDate = new Date(this.selectedStartDate);
    const endDate = new Date(this.selectedEndDate);
    
    return currentDate > startDate && currentDate < endDate;
  }

  isHoverInRange(date: string): boolean {
    if (!this.selectedStartDate || this.selectedEndDate || !this.hoverDate) return false;
    
    const currentDate = new Date(date);
    const startDate = new Date(this.selectedStartDate);
    const hoverDate = new Date(this.hoverDate);
    
    if (hoverDate > startDate) {
      return currentDate > startDate && currentDate < hoverDate;
    }
    
    return false;
  }

  isStartDate(date: string): boolean {
    return this.selectedStartDate === date;
  }

  isEndDate(date: string): boolean {
    return this.selectedEndDate === date;
  }

  isSelectedDate(date: string): boolean {
    return this.selectedDates.includes(date);
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadCalendar();
  }

  clearSelection() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.selectedDates = [];
    this.hoverDate = null;
    this.dateRangeCleared.emit();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDateNumber(date: string): number {
    return new Date(date).getDate();
  }

  getDatePrice(day: AvailabilityCalendar): string {
    if (day.price && day.price > 0) {
      return `$${day.price}`;
    }
    return '';
  }

  getDayNumber(date: string): number {
    return new Date(date).getDate();
  }

  calculateNights(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
}
