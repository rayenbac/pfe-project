import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reservations">
      <div class="reservations-header">
        <h1>Reservations</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Export Schedule</button>
          <button class="btn btn-primary">+ New Reservation</button>
        </div>
      </div>

      <div class="reservations-stats">
        <div class="row">
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon upcoming">📅</div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.upcoming }}</div>
                <div class="stat-label">Upcoming</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon confirmed">✅</div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.confirmed }}</div>
                <div class="stat-label">Confirmed</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon pending">⏳</div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.pending }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon total">📊</div>
              <div class="stat-content">
                <div class="stat-number">{{ stats.thisMonth }}</div>
                <div class="stat-label">This Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="reservations-filters">
        <div class="filter-group">
          <select class="form-control">
            <option>All Status</option>
            <option>Confirmed</option>
            <option>Pending</option>
            <option>Cancelled</option>
            <option>Completed</option>
          </select>
        </div>
        <div class="filter-group">
          <select class="form-control">
            <option>All Types</option>
            <option>Property Viewing</option>
            <option>Consultation</option>
            <option>Document Signing</option>
            <option>Property Inspection</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" class="form-control" placeholder="Search reservations...">
        </div>
      </div>

      <div class="reservations-content">
        <div class="reservations-list">
          <div class="reservation-card" *ngFor="let reservation of reservations">
            <div class="reservation-header">
              <div class="reservation-type" [ngClass]="'type-' + reservation.type.toLowerCase().replace(' ', '-')">
                {{ getTypeIcon(reservation.type) }} {{ reservation.type }}
              </div>
              <div class="reservation-status" [ngClass]="'status-' + reservation.status.toLowerCase()">
                {{ reservation.status }}
              </div>
            </div>

            <div class="reservation-content">
              <div class="reservation-details">
                <h3 class="reservation-title">{{ reservation.title }}</h3>
                <div class="reservation-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">{{ reservation.date | date:'fullDate' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">🕒</span>
                    <span class="meta-text">{{ reservation.time }} ({{ reservation.duration }})</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">📍</span>
                    <span class="meta-text">{{ reservation.location }}</span>
                  </div>
                </div>
              </div>

              <div class="reservation-participants">
                <h4>Participants</h4>
                <div class="participants-list">
                  <div class="participant" *ngFor="let participant of reservation.participants">
                    <div class="participant-avatar">
                      <img [src]="participant.avatar" [alt]="participant.name">
                      <div class="participant-role">{{ participant.role.charAt(0) }}</div>
                    </div>
                    <div class="participant-info">
                      <div class="participant-name">{{ participant.name }}</div>
                      <div class="participant-contact">{{ participant.email }}</div>
                      <div class="participant-phone">{{ participant.phone }}</div>
                    </div>
                    <div class="participant-status" [ngClass]="'participant-' + participant.status">
                      {{ participant.status }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="reservation-property" *ngIf="reservation.property">
                <h4>Property Details</h4>
                <div class="property-info">
                  <div class="property-image">
                    <img [src]="reservation.property.image" [alt]="reservation.property.title">
                  </div>
                  <div class="property-details">
                    <div class="property-title">{{ reservation.property.title }}</div>
                    <div class="property-address">{{ reservation.property.address }}</div>
                    <div class="property-price">{{ reservation.property.price | currency }}</div>
                    <div class="property-features">
                      {{ reservation.property.bedrooms }} bed • {{ reservation.property.bathrooms }} bath • {{ reservation.property.area }} sqft
                    </div>
                  </div>
                </div>
              </div>

              <div class="reservation-notes" *ngIf="reservation.notes">
                <h4>Notes</h4>
                <div class="notes-content">{{ reservation.notes }}</div>
              </div>

              <div class="reservation-actions">
                <button class="btn btn-outline btn-sm">Reschedule</button>
                <button class="btn btn-outline btn-sm">Add Notes</button>
                <button class="btn btn-outline btn-sm">Send Reminder</button>
                <button class="btn btn-primary btn-sm" *ngIf="reservation.status === 'Pending'">Confirm</button>
                <button class="btn btn-primary btn-sm" *ngIf="reservation.status === 'Confirmed'">Complete</button>
              </div>
            </div>

            <div class="reservation-timeline" *ngIf="reservation.timeline">
              <h4>Timeline</h4>
              <div class="timeline">
                <div class="timeline-item" *ngFor="let event of reservation.timeline">
                  <div class="timeline-marker" [ngClass]="'marker-' + event.type"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">{{ event.title }}</div>
                    <div class="timeline-description">{{ event.description }}</div>
                    <div class="timeline-time">{{ event.timestamp | date:'short' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="reservations-sidebar">
          <div class="card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions">
              <button class="quick-action-btn">
                <span class="action-icon">📅</span>
                <span class="action-text">Schedule Viewing</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">💼</span>
                <span class="action-text">Book Consultation</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">📝</span>
                <span class="action-text">Arrange Signing</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">🔍</span>
                <span class="action-text">Property Inspection</span>
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Today's Schedule</h3>
            </div>
            <div class="todays-schedule">
              <div class="schedule-item" *ngFor="let item of todaysSchedule">
                <div class="schedule-time">{{ item.time }}</div>
                <div class="schedule-details">
                  <div class="schedule-title">{{ item.title }}</div>
                  <div class="schedule-client">{{ item.client }}</div>
                  <div class="schedule-location">{{ item.location }}</div>
                </div>
                <div class="schedule-status" [ngClass]="'status-' + item.status.toLowerCase()">
                  {{ item.status }}
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Calendar Integration</h3>
            </div>
            <div class="calendar-integration">
              <div class="integration-item">
                <span class="integration-icon">📅</span>
                <span class="integration-text">Google Calendar</span>
                <button class="btn btn-outline btn-sm">Sync</button>
              </div>
              <div class="integration-item">
                <span class="integration-icon">📧</span>
                <span class="integration-text">Outlook Calendar</span>
                <button class="btn btn-outline btn-sm">Connect</button>
              </div>
              <div class="integration-item">
                <span class="integration-icon">📱</span>
                <span class="integration-text">Apple Calendar</span>
                <button class="btn btn-outline btn-sm">Link</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reservations {
      padding: 2rem;
    }

    .reservations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .reservations-stats {
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .stat-icon.upcoming {
      background: linear-gradient(135deg, #17a2b8, #20c997);
    }

    .stat-icon.confirmed {
      background: linear-gradient(135deg, #28a745, #34ce57);
    }

    .stat-icon.pending {
      background: linear-gradient(135deg, #ffc107, #ffcd39);
    }

    .stat-icon.total {
      background: linear-gradient(135deg, var(--primary), #ff7478);
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
    }

    .reservations-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--accent);
      border-radius: 12px;
    }

    .filter-group {
      flex: 1;
    }

    .reservations-content {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .reservations-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .reservation-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .reservation-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .reservation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--accent);
      border-bottom: 1px solid var(--border);
    }

    .reservation-type {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .type-property-viewing {
      background: #17a2b8;
      color: white;
    }

    .type-consultation {
      background: #28a745;
      color: white;
    }

    .type-document-signing {
      background: #ffc107;
      color: #000;
    }

    .type-property-inspection {
      background: var(--primary);
      color: white;
    }

    .reservation-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-confirmed {
      background: #28a745;
      color: white;
    }

    .status-pending {
      background: #ffc107;
      color: #000;
    }

    .status-cancelled {
      background: #dc3545;
      color: white;
    }

    .status-completed {
      background: #6c757d;
      color: white;
    }

    .reservation-content {
      padding: 1.5rem;
    }

    .reservation-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 1rem;
    }

    .reservation-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meta-icon {
      font-size: 1.1rem;
    }

    .meta-text {
      font-size: 0.875rem;
      color: #666;
    }

    .reservation-participants {
      margin-bottom: 1.5rem;
    }

    .reservation-participants h4,
    .reservation-property h4,
    .reservation-notes h4,
    .reservation-timeline h4 {
      font-size: 1rem;
      color: var(--secondary);
      margin-bottom: 0.75rem;
    }

    .participants-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .participant {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--accent);
      border-radius: 8px;
    }

    .participant-avatar {
      position: relative;
    }

    .participant-avatar img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .participant-role {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      border: 2px solid white;
    }

    .participant-info {
      flex: 1;
    }

    .participant-name {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .participant-contact,
    .participant-phone {
      font-size: 0.875rem;
      color: #666;
    }

    .participant-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .participant-confirmed {
      background: #28a745;
      color: white;
    }

    .participant-pending {
      background: #ffc107;
      color: #000;
    }

    .reservation-property {
      margin-bottom: 1.5rem;
    }

    .property-info {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
    }

    .property-image img {
      width: 80px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
    }

    .property-details {
      flex: 1;
    }

    .property-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .property-address {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .property-price {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .property-features {
      font-size: 0.875rem;
      color: #666;
    }

    .reservation-notes {
      margin-bottom: 1.5rem;
    }

    .notes-content {
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
      color: #666;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .reservation-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .reservation-timeline {
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 1rem;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -1.5rem;
      top: 1rem;
      bottom: -1rem;
      width: 2px;
      background: var(--border);
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-marker {
      position: absolute;
      left: -2rem;
      top: 0.25rem;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
    }

    .marker-created {
      background: #28a745;
    }

    .marker-updated {
      background: #ffc107;
    }

    .marker-confirmed {
      background: #17a2b8;
    }

    .timeline-content {
      padding: 0.5rem 0;
    }

    .timeline-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .timeline-description {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .timeline-time {
      font-size: 0.75rem;
      color: #999;
    }

    .reservations-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .quick-actions {
      padding: 1rem;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem;
      border: none;
      background: var(--accent);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .quick-action-btn:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .action-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .action-text {
      font-weight: 500;
      color: var(--secondary);
    }

    .todays-schedule {
      padding: 1rem;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .schedule-item:last-child {
      border-bottom: none;
    }

    .schedule-time {
      font-weight: 600;
      color: var(--primary);
      min-width: 60px;
    }

    .schedule-details {
      flex: 1;
    }

    .schedule-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .schedule-client,
    .schedule-location {
      font-size: 0.875rem;
      color: #666;
    }

    .schedule-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .calendar-integration {
      padding: 1rem;
    }

    .integration-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }

    .integration-item:last-child {
      border-bottom: none;
    }

    .integration-icon {
      font-size: 1.2rem;
    }

    .integration-text {
      flex: 1;
      font-weight: 500;
      color: var(--secondary);
    }

    @media (max-width: 1024px) {
      .reservations-content {
        grid-template-columns: 1fr;
      }

      .reservations-sidebar {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .reservations-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .reservations-filters {
        flex-direction: column;
      }

      .reservation-meta {
        flex-direction: column;
        gap: 0.5rem;
      }

      .property-info {
        flex-direction: column;
      }

      .property-image img {
        width: 100%;
        height: 120px;
      }

      .participant {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
      }

      .reservation-actions {
        flex-direction: column;
      }

      .btn-sm {
        width: 100%;
      }
    }
  `]
})
export class ReservationsComponent {
  stats = {
    upcoming: 12,
    confirmed: 8,
    pending: 4,
    thisMonth: 28
  };

  reservations = [
    {
      id: 1,
      title: 'Downtown Luxury Apartment Viewing',
      type: 'Property Viewing',
      status: 'Confirmed',
      date: new Date('2024-01-28'),
      time: '10:00 AM',
      duration: '1 hour',
      location: '123 Main Street, Downtown',
      participants: [
        {
          name: 'Sarah Johnson',
          role: 'Client',
          email: 'sarah@email.com',
          phone: '+1 (555) 123-4567',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
          status: 'Confirmed'
        },
        {
          name: 'John Smith',
          role: 'Agent',
          email: 'john@realestate.com',
          phone: '+1 (555) 987-6543',
          avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100',
          status: 'Confirmed'
        }
      ],
      property: {
        title: 'Modern Downtown Apartment',
        address: '123 Main Street, Downtown',
        price: 2500,
        image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=200',
        bedrooms: 2,
        bathrooms: 2,
        area: 1200
      },
      notes: 'Client is specifically interested in the downtown location due to proximity to work. They mentioned preferring units on higher floors with city views.',
      timeline: [
        {
          type: 'created',
          title: 'Reservation Created',
          description: 'Initial viewing appointment scheduled',
          timestamp: new Date('2024-01-25T09:30:00')
        },
        {
          type: 'confirmed',
          title: 'Client Confirmed',
          description: 'Client confirmed attendance via email',
          timestamp: new Date('2024-01-26T14:15:00')
        }
      ]
    },
    {
      id: 2,
      title: 'First-Time Buyer Consultation',
      type: 'Consultation',
      status: 'Pending',
      date: new Date('2024-01-29'),
      time: '2:00 PM',
      duration: '90 minutes',
      location: 'Office Conference Room A',
      participants: [
        {
          name: 'Mike Wilson',
          role: 'Client',
          email: 'mike@email.com',
          phone: '+1 (555) 234-5678',
          avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
          status: 'Pending'
        }
      ],
      notes: 'First-time buyer consultation. Need to discuss mortgage pre-approval, market conditions, and establish budget parameters.',
      timeline: [
        {
          type: 'created',
          title: 'Consultation Scheduled',
          description: 'Initial consultation appointment created',
          timestamp: new Date('2024-01-26T11:00:00')
        }
      ]
    },
    {
      id: 3,
      title: 'Contract Signing - Waterfront Condo',
      type: 'Document Signing',
      status: 'Confirmed',
      date: new Date('2024-01-30'),
      time: '11:00 AM',
      duration: '2 hours',
      location: 'Notary Office - 456 Business Plaza',
      participants: [
        {
          name: 'Emma Davis',
          role: 'Buyer',
          email: 'emma@email.com',
          phone: '+1 (555) 345-6789',
          avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100',
          status: 'Confirmed'
        },
        {
          name: 'Robert Chen',
          role: 'Seller',
          email: 'robert@email.com',
          phone: '+1 (555) 456-7890',
          avatar: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=100',
          status: 'Confirmed'
        }
      ],
      property: {
        title: 'Luxury Waterfront Condo',
        address: '789 Beach Road, Marina',
        price: 750000,
        image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200',
        bedrooms: 3,
        bathrooms: 2,
        area: 1800
      },
      notes: 'Final contract signing. All documents have been reviewed. Bring certified checks and identification.',
      timeline: [
        {
          type: 'created',
          title: 'Signing Appointment Set',
          description: 'Contract signing scheduled after final negotiations',
          timestamp: new Date('2024-01-27T16:45:00')
        },
        {
          type: 'updated',
          title: 'Documents Prepared',
          description: 'All legal documents prepared and reviewed',
          timestamp: new Date('2024-01-28T10:30:00')
        }
      ]
    }
  ];

  todaysSchedule = [
    {
      time: '09:00',
      title: 'Property Inspection',
      client: 'Lisa Anderson',
      location: '321 Oak Avenue',
      status: 'Confirmed'
    },
    {
      time: '11:30',
      title: 'Client Meeting',
      client: 'David Miller',
      location: 'Office',
      status: 'Pending'
    },
    {
      time: '14:00',
      title: 'Property Showing',
      client: 'Jennifer Lee',
      location: '555 Pine Street',
      status: 'Confirmed'
    },
    {
      time: '16:30',
      title: 'Follow-up Call',
      client: 'Thomas Brown',
      location: 'Phone',
      status: 'Confirmed'
    }
  ];

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Property Viewing': '🏠',
      'Consultation': '💼',
      'Document Signing': '📝',
      'Property Inspection': '🔍'
    };
    return icons[type] || '📅';
  }
}