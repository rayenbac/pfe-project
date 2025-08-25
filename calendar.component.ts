import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar">
      <div class="calendar-header">
        <h1>Booking Calendar</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Export Calendar</button>
          <button class="btn btn-primary">+ New Appointment</button>
        </div>
      </div>

      <div class="calendar-controls">
        <div class="view-selector">
          <button class="view-btn" [class.active]="currentView === 'month'" (click)="setView('month')">Month</button>
          <button class="view-btn" [class.active]="currentView === 'week'" (click)="setView('week')">Week</button>
          <button class="view-btn" [class.active]="currentView === 'day'" (click)="setView('day')">Day</button>
        </div>
        
        <div class="date-navigation">
          <button class="nav-btn" (click)="previousPeriod()">←</button>
          <h2 class="current-period">{{ getCurrentPeriodLabel() }}</h2>
          <button class="nav-btn" (click)="nextPeriod()">→</button>
          <button class="btn btn-outline btn-sm" (click)="goToToday()">Today</button>
        </div>
      </div>

      <div class="calendar-content">
        <!-- Month View -->
        <div class="month-view" *ngIf="currentView === 'month'">
          <div class="weekdays">
            <div class="weekday" *ngFor="let day of weekdays">{{ day }}</div>
          </div>
          <div class="calendar-grid">
            <div class="calendar-day" 
                 *ngFor="let day of calendarDays" 
                 [class.other-month]="!day.isCurrentMonth"
                 [class.today]="day.isToday"
                 [class.has-appointments]="day.appointments && day.appointments.length > 0">
              <div class="day-number">{{ day.date }}</div>
              <div class="day-appointments" *ngIf="day.appointments">
                <div class="appointment-dot" 
                     *ngFor="let appointment of day.appointments.slice(0, 3)"
                     [ngClass]="'appointment-' + appointment.type">
                  {{ appointment.title }}
                </div>
                <div class="more-appointments" *ngIf="day.appointments.length > 3">
                  +{{ day.appointments.length - 3 }} more
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week View -->
        <div class="week-view" *ngIf="currentView === 'week'">
          <div class="time-column">
            <div class="time-slot" *ngFor="let hour of hours">{{ hour }}</div>
          </div>
          <div class="week-days">
            <div class="week-day" *ngFor="let day of weekDays">
              <div class="week-day-header">
                <div class="day-name">{{ day.name }}</div>
                <div class="day-date" [class.today]="day.isToday">{{ day.date }}</div>
              </div>
              <div class="week-day-content">
                <div class="appointment-block" 
                     *ngFor="let appointment of day.appointments"
                     [style.top.px]="getAppointmentTop(appointment.time)"
                     [style.height.px]="getAppointmentHeight(appointment.duration)"
                     [ngClass]="'appointment-' + appointment.type">
                  <div class="appointment-time">{{ appointment.time }}</div>
                  <div class="appointment-title">{{ appointment.title }}</div>
                  <div class="appointment-client">{{ appointment.client }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Appointments Sidebar -->
      <div class="appointments-sidebar">
        <div class="card">
          <div class="card-header">
            <h3>Today's Appointments</h3>
          </div>
          <div class="appointments-list">
            <div class="appointment-item" *ngFor="let appointment of todayAppointments">
              <div class="appointment-time-badge" [ngClass]="'badge-' + appointment.type">
                {{ appointment.time }}
              </div>
              <div class="appointment-details">
                <div class="appointment-title">{{ appointment.title }}</div>
                <div class="appointment-client">👤 {{ appointment.client }}</div>
                <div class="appointment-property">🏠 {{ appointment.property }}</div>
              </div>
              <div class="appointment-actions">
                <button class="btn btn-outline btn-sm">Reschedule</button>
                <button class="btn btn-primary btn-sm">Start</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Quick Stats</h3>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ monthStats.total }}</div>
              <div class="stat-label">Total Bookings</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ monthStats.viewings }}</div>
              <div class="stat-label">Property Viewings</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ monthStats.consultations }}</div>
              <div class="stat-label">Consultations</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ monthStats.signings }}</div>
              <div class="stat-label">Contract Signings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar {
      padding: 2rem;
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 2rem;
      height: calc(100vh - 4rem);
    }

    .calendar-header {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .calendar-controls {
      grid-column: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: var(--accent);
      border-radius: 12px;
    }

    .view-selector {
      display: flex;
      gap: 0.5rem;
    }

    .view-btn {
      padding: 0.5rem 1rem;
      border: 2px solid var(--border);
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .view-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .date-navigation {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
      border: 2px solid var(--border);
      background: white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }

    .nav-btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .current-period {
      margin: 0;
      min-width: 200px;
      text-align: center;
      color: var(--secondary);
    }

    .calendar-content {
      grid-column: 1;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    /* Month View Styles */
    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: var(--accent);
      border-bottom: 1px solid var(--border);
    }

    .weekday {
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: var(--secondary);
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .calendar-day {
      min-height: 120px;
      padding: 0.5rem;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .calendar-day:hover {
      background: var(--accent);
    }

    .calendar-day.today {
      background: rgba(255, 90, 95, 0.1);
    }

    .calendar-day.other-month {
      opacity: 0.3;
    }

    .day-number {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--secondary);
    }

    .today .day-number {
      background: var(--primary);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .appointment-dot {
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .appointment-viewing {
      background: #28a745;
    }

    .appointment-consultation {
      background: #17a2b8;
    }

    .appointment-signing {
      background: #ffc107;
      color: #000;
    }

    .more-appointments {
      font-size: 0.75rem;
      color: #666;
      font-style: italic;
    }

    /* Week View Styles */
    .week-view {
      display: grid;
      grid-template-columns: 80px 1fr;
      height: 600px;
      overflow-y: auto;
    }

    .time-column {
      border-right: 1px solid var(--border);
    }

    .time-slot {
      height: 60px;
      padding: 0.5rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
      color: #666;
      text-align: center;
    }

    .week-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .week-day {
      border-right: 1px solid var(--border);
    }

    .week-day:last-child {
      border-right: none;
    }

    .week-day-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      text-align: center;
      background: var(--accent);
    }

    .day-name {
      font-weight: 600;
      color: var(--secondary);
    }

    .day-date {
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 0.5rem;
    }

    .day-date.today {
      color: var(--primary);
    }

    .week-day-content {
      position: relative;
      height: 100%;
    }

    .appointment-block {
      position: absolute;
      left: 2px;
      right: 2px;
      background: var(--primary);
      color: white;
      border-radius: 4px;
      padding: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .appointment-block:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
    }

    .appointment-time {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .appointment-title {
      margin-bottom: 0.25rem;
    }

    .appointment-client {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    /* Sidebar Styles */
    .appointments-sidebar {
      grid-column: 2;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .appointments-list {
      padding: 1rem;
    }

    .appointment-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .appointment-item:last-child {
      border-bottom: none;
    }

    .appointment-time-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      min-width: 80px;
      text-align: center;
    }

    .badge-viewing {
      background: #28a745;
      color: white;
    }

    .badge-consultation {
      background: #17a2b8;
      color: white;
    }

    .badge-signing {
      background: #ffc107;
      color: #000;
    }

    .appointment-details {
      flex: 1;
    }

    .appointment-title {
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .appointment-client,
    .appointment-property {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .appointment-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
    }

    .stat-item {
      text-align: center;
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    @media (max-width: 1024px) {
      .calendar {
        grid-template-columns: 1fr;
      }

      .appointments-sidebar {
        grid-column: 1;
      }
    }

    @media (max-width: 768px) {
      .calendar {
        padding: 1rem;
      }

      .calendar-header {
        flex-direction: column;
        gap: 1rem;
      }

      .calendar-controls {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .date-navigation {
        justify-content: center;
      }
    }
  `]
})
export class CalendarComponent {
  currentView: 'month' | 'week' | 'day' = 'month';
  currentDate = new Date();

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  monthStats = {
    total: 45,
    viewings: 28,
    consultations: 12,
    signings: 5
  };

  todayAppointments = [
    {
      time: '09:00',
      title: 'Property Viewing',
      client: 'Sarah Johnson',
      property: '123 Main Street',
      type: 'viewing'
    },
    {
      time: '11:30',
      title: 'Client Consultation',
      client: 'Mike Wilson',
      property: 'Downtown Loft',
      type: 'consultation'
    },
    {
      time: '14:00',
      title: 'Contract Signing',
      client: 'Emma Davis',
      property: 'Suburban Villa',
      type: 'signing'
    },
    {
      time: '16:30',
      title: 'Property Viewing',
      client: 'Robert Chen',
      property: 'City Center Apt',
      type: 'viewing'
    }
  ];

  calendarDays = this.generateCalendarDays();
  weekDays = this.generateWeekDays();

  setView(view: 'month' | 'week' | 'day') {
    this.currentView = view;
  }

  getCurrentPeriodLabel(): string {
    if (this.currentView === 'month') {
      return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (this.currentView === 'week') {
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return this.currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  previousPeriod() {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.updateCalendar();
  }

  nextPeriod() {
    if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.updateCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.updateCalendar();
  }

  private updateCalendar() {
    this.calendarDays = this.generateCalendarDays();
    this.weekDays = this.generateWeekDays();
  }

  private generateCalendarDays() {
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      days.push({
        date: date.getDate(),
        isCurrentMonth: date.getMonth() === this.currentDate.getMonth(),
        isToday: date.toDateString() === today.toDateString(),
        appointments: this.getAppointmentsForDay(date)
      });
    }

    return days;
  }

  private generateWeekDays() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      days.push({
        name: this.weekdays[i],
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        appointments: this.getAppointmentsForDay(date)
      });
    }

    return days;
  }

  private getAppointmentsForDay(date: Date) {
    // Mock appointments data
    const appointments = [
      { title: 'Property Viewing', type: 'viewing', time: '09:00', duration: 60, client: 'John Doe' },
      { title: 'Client Meeting', type: 'consultation', time: '11:00', duration: 90, client: 'Jane Smith' },
      { title: 'Contract Signing', type: 'signing', time: '14:00', duration: 60, client: 'Bob Johnson' }
    ];

    // Return appointments for some days (mock logic)
    return Math.random() > 0.7 ? appointments.slice(0, Math.floor(Math.random() * 3) + 1) : [];
  }

  getAppointmentTop(time: string): number {
    const [hours] = time.split(':').map(Number);
    return hours * 60;
  }

  getAppointmentHeight(duration: number): number {
    return duration;
  }
}