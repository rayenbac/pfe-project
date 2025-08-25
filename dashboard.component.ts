import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your real estate business.</p>
      </div>

      <!-- Stats Cards -->
      <div class="row">
        <div class="col-3">
          <div class="stats-card">
            <div class="stats-number">{{ stats.totalProperties }}</div>
            <div class="stats-label">Total Properties</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stats-card" style="background: linear-gradient(135deg, #28a745, #34ce57);">
            <div class="stats-number">{{ stats.activeListings }}</div>
            <div class="stats-label">Active Listings</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stats-card" style="background: linear-gradient(135deg, #ffc107, #ffcd39);">
            <div class="stats-number">{{ stats.pendingContracts }}</div>
            <div class="stats-label">Pending Contracts</div>
          </div>
        </div>
        <div class="col-3">
          <div class="stats-card" style="background: linear-gradient(135deg, #17a2b8, #20c997);">
            <div class="stats-number">{{ stats.totalEarnings | currency }}</div>
            <div class="stats-label">Total Earnings</div>
          </div>
        </div>
      </div>

      <!-- Charts and Analytics -->
      <div class="row">
        <div class="col-8">
          <div class="card">
            <div class="card-header">
              <h3>Monthly Sales Performance</h3>
            </div>
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-bars">
                  <div class="bar" style="height: 60%;" data-month="Jan" data-value="12"></div>
                  <div class="bar" style="height: 80%;" data-month="Feb" data-value="18"></div>
                  <div class="bar" style="height: 45%;" data-month="Mar" data-value="8"></div>
                  <div class="bar" style="height: 90%;" data-month="Apr" data-value="22"></div>
                  <div class="bar" style="height: 70%;" data-month="May" data-value="15"></div>
                  <div class="bar" style="height: 95%;" data-month="Jun" data-value="25"></div>
                </div>
                <div class="chart-labels">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-4">
          <div class="card">
            <div class="card-header">
              <h3>Property Types</h3>
            </div>
            <div class="property-types">
              <div class="property-type" *ngFor="let type of propertyTypes">
                <div class="type-info">
                  <span class="type-name">{{ type.name }}</span>
                  <span class="type-count">{{ type.count }}</span>
                </div>
                <div class="type-bar">
                  <div class="type-fill" [style.width.%]="type.percentage"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-6">
          <div class="card">
            <div class="card-header">
              <h3>Recent Activities</h3>
            </div>
            <div class="activity-list">
              <div class="activity-item" *ngFor="let activity of recentActivities">
                <div class="activity-icon" [ngClass]="'activity-' + activity.type">{{ activity.icon }}</div>
                <div class="activity-details">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-6">
          <div class="card">
            <div class="card-header">
              <h3>Upcoming Appointments</h3>
            </div>
            <div class="appointments-list">
              <div class="appointment-item" *ngFor="let appointment of upcomingAppointments">
                <div class="appointment-time">
                  <div class="time">{{ appointment.time }}</div>
                  <div class="date">{{ appointment.date }}</div>
                </div>
                <div class="appointment-details">
                  <div class="client-name">{{ appointment.client }}</div>
                  <div class="property-address">{{ appointment.property }}</div>
                </div>
                <div class="appointment-type">
                  <span class="badge badge-primary">{{ appointment.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .chart-container {
      padding: 1rem;
      height: 300px;
    }

    .chart-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      justify-content: space-around;
      height: 200px;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .bar {
      flex: 1;
      background: linear-gradient(180deg, var(--primary), #ff7478);
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      position: relative;
      cursor: pointer;
    }

    .bar:hover {
      transform: scaleY(1.05);
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
    }

    .chart-labels {
      display: flex;
      justify-content: space-around;
      font-weight: 500;
      color: var(--secondary);
    }

    .property-types {
      padding: 1rem;
    }

    .property-type {
      margin-bottom: 1.5rem;
    }

    .type-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .type-name {
      font-weight: 500;
      color: var(--secondary);
    }

    .type-count {
      font-weight: 600;
      color: var(--primary);
    }

    .type-bar {
      height: 8px;
      background: var(--accent);
      border-radius: 4px;
      overflow: hidden;
    }

    .type-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #ff7478);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .activity-list {
      padding: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .activity-sale {
      background: linear-gradient(135deg, #28a745, #34ce57);
      color: white;
    }

    .activity-listing {
      background: linear-gradient(135deg, #17a2b8, #20c997);
      color: white;
    }

    .activity-contract {
      background: linear-gradient(135deg, #ffc107, #ffcd39);
      color: white;
    }

    .activity-details {
      flex: 1;
    }

    .activity-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.875rem;
      color: #666;
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

    .appointment-time {
      text-align: center;
      min-width: 60px;
    }

    .time {
      font-weight: 600;
      color: var(--primary);
      font-size: 1.1rem;
    }

    .date {
      font-size: 0.875rem;
      color: #666;
    }

    .appointment-details {
      flex: 1;
    }

    .client-name {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .property-address {
      font-size: 0.875rem;
      color: #666;
    }
  `]
})
export class DashboardComponent {
  stats = {
    totalProperties: 45,
    activeListings: 23,
    pendingContracts: 8,
    totalEarnings: 125000
  };

  propertyTypes = [
    { name: 'Houses', count: 18, percentage: 60 },
    { name: 'Apartments', count: 15, percentage: 50 },
    { name: 'Condos', count: 8, percentage: 30 },
    { name: 'Commercial', count: 4, percentage: 15 }
  ];

  recentActivities = [
    { type: 'sale', icon: '💰', title: 'Property sold at Oak Street', time: '2 hours ago' },
    { type: 'listing', icon: '🏠', title: 'New listing added - Downtown Apt', time: '5 hours ago' },
    { type: 'contract', icon: '📄', title: 'Contract signed for Villa Marina', time: '1 day ago' },
    { type: 'sale', icon: '💰', title: 'Rental agreement finalized', time: '2 days ago' }
  ];

  upcomingAppointments = [
    { time: '10:00', date: 'Today', client: 'Sarah Johnson', property: '123 Main Street', type: 'Viewing' },
    { time: '14:30', date: 'Today', client: 'Mike Wilson', property: 'Downtown Loft', type: 'Consultation' },
    { time: '09:00', date: 'Tomorrow', client: 'Emma Davis', property: 'Suburban Villa', type: 'Signing' },
    { time: '16:00', date: 'Tomorrow', client: 'Robert Chen', property: 'City Center Apt', type: 'Viewing' }
  ];
}