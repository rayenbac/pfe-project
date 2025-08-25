import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contracts">
      <div class="contracts-header">
        <h1>My Contracts</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Export Contracts</button>
          <button class="btn btn-primary">+ New Contract</button>
        </div>
      </div>

      <div class="contracts-filters">
        <div class="filter-group">
          <select class="form-control">
            <option>All Status</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div class="filter-group">
          <select class="form-control">
            <option>All Types</option>
            <option>Sale</option>
            <option>Rent</option>
            <option>Lease</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" class="form-control" placeholder="Search contracts...">
        </div>
      </div>

      <div class="contracts-table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Property</th>
              <th>Client</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let contract of contracts" [class]="'contract-row-' + contract.status.toLowerCase()">
              <td>
                <div class="contract-id">
                  <strong>{{ contract.id }}</strong>
                  <div class="contract-ref">{{ contract.reference }}</div>
                </div>
              </td>
              <td>
                <div class="property-info">
                  <div class="property-title">{{ contract.property.title }}</div>
                  <div class="property-address">{{ contract.property.address }}</div>
                </div>
              </td>
              <td>
                <div class="client-info">
                  <div class="client-name">{{ contract.client.name }}</div>
                  <div class="client-contact">{{ contract.client.email }}</div>
                  <div class="client-phone">{{ contract.client.phone }}</div>
                </div>
              </td>
              <td>
                <span class="contract-type" [ngClass]="'type-' + contract.type.toLowerCase()">
                  {{ contract.type }}
                </span>
              </td>
              <td>
                <div class="amount">{{ contract.amount | currency }}</div>
                <div class="commission" *ngIf="contract.commission">
                  Commission: {{ contract.commission | currency }}
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="'badge-' + getStatusClass(contract.status)">
                  {{ contract.status }}
                </span>
              </td>
              <td>
                <div class="date">{{ contract.dateCreated | date:'short' }}</div>
                <div class="deadline" *ngIf="contract.deadline">
                  Due: {{ contract.deadline | date:'short' }}
                </div>
              </td>
              <td>
                <div class="actions">
                  <button class="action-btn" title="View">👁️</button>
                  <button class="action-btn" title="Edit">✏️</button>
                  <button class="action-btn" title="Download">💾</button>
                  <button class="action-btn" title="Send">📧</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="contracts-stats">
        <div class="row">
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon">📄</div>
              <div class="stat-content">
                <div class="stat-number">{{ contractStats.total }}</div>
                <div class="stat-label">Total Contracts</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-content">
                <div class="stat-number">{{ contractStats.pending }}</div>
                <div class="stat-label">Pending Review</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-number">{{ contractStats.active }}</div>
                <div class="stat-label">Active Contracts</div>
              </div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <div class="stat-number">{{ contractStats.totalValue | currency }}</div>
                <div class="stat-label">Total Value</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="recent-activity">
        <div class="card">
          <div class="card-header">
            <h3>Recent Contract Activity</h3>
          </div>
          <div class="activity-timeline">
            <div class="timeline-item" *ngFor="let activity of recentActivity">
              <div class="timeline-marker" [ngClass]="'marker-' + activity.type"></div>
              <div class="timeline-content">
                <div class="activity-header">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-contract">Contract: {{ activity.contractId }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contracts {
      padding: 2rem;
    }

    .contracts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .contracts-filters {
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

    .contracts-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .table {
      margin: 0;
    }

    .table th {
      background: var(--secondary);
      color: white;
      font-weight: 600;
      padding: 1rem;
      border: none;
    }

    .table td {
      padding: 1rem;
      vertical-align: top;
      border-bottom: 1px solid var(--border);
    }

    .contract-row-pending {
      background: rgba(255, 193, 7, 0.1);
    }

    .contract-row-active {
      background: rgba(40, 167, 69, 0.1);
    }

    .contract-row-cancelled {
      background: rgba(220, 53, 69, 0.1);
    }

    .contract-id {
      display: flex;
      flex-direction: column;
    }

    .contract-ref {
      font-size: 0.875rem;
      color: #666;
    }

    .property-info {
      display: flex;
      flex-direction: column;
    }

    .property-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .property-address {
      font-size: 0.875rem;
      color: #666;
    }

    .client-info {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .client-contact,
    .client-phone {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.125rem;
    }

    .contract-type {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .type-sale {
      background: #28a745;
      color: white;
    }

    .type-rent {
      background: #17a2b8;
      color: white;
    }

    .type-lease {
      background: #ffc107;
      color: #000;
    }

    .amount {
      font-weight: 600;
      color: var(--primary);
      font-size: 1.1rem;
    }

    .commission {
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .badge-success { background: #28a745; }
    .badge-warning { background: #ffc107; color: #000; }
    .badge-danger { background: #dc3545; }
    .badge-secondary { background: #6c757d; }

    .date {
      font-weight: 500;
      color: var(--secondary);
    }

    .deadline {
      font-size: 0.875rem;
      color: var(--primary);
      margin-top: 0.25rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--accent);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: var(--primary);
      color: white;
      transform: translateY(-2px);
    }

    .contracts-stats {
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
      font-size: 2.5rem;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), #ff7478);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
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

    .recent-activity {
      margin-top: 2rem;
    }

    .activity-timeline {
      padding: 1rem;
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-left: 1rem;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: 1.5rem;
      top: 2rem;
      bottom: -1.5rem;
      width: 2px;
      background: var(--border);
    }

    .timeline-item:last-child::before {
      display: none;
    }

    .timeline-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: white;
      flex-shrink: 0;
    }

    .marker-created {
      background: #28a745;
    }

    .marker-signed {
      background: #17a2b8;
    }

    .marker-updated {
      background: #ffc107;
    }

    .marker-sent {
      background: var(--primary);
    }

    .timeline-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .activity-title {
      font-weight: 600;
      color: var(--secondary);
    }

    .activity-time {
      font-size: 0.875rem;
      color: #666;
    }

    .activity-description {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .activity-contract {
      font-size: 0.875rem;
      color: var(--primary);
      font-weight: 500;
    }

    @media (max-width: 1024px) {
      .contracts-table-container {
        overflow-x: auto;
      }

      .table {
        min-width: 800px;
      }
    }

    @media (max-width: 768px) {
      .contracts-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .contracts-filters {
        flex-direction: column;
      }

      .stat-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ContractsComponent {
  contractStats = {
    total: 34,
    pending: 8,
    active: 19,
    totalValue: 2850000
  };

  contracts = [
    {
      id: 'CT-001',
      reference: 'REF-2024-001',
      property: {
        title: 'Modern Downtown Apartment',
        address: '123 Main Street, Downtown'
      },
      client: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567'
      },
      type: 'Rent',
      amount: 2500,
      commission: 250,
      status: 'Active',
      dateCreated: new Date('2024-01-15'),
      deadline: new Date('2024-02-01')
    },
    {
      id: 'CT-002',
      reference: 'REF-2024-002',
      property: {
        title: 'Spacious Family House',
        address: '456 Oak Avenue, Suburbs'
      },
      client: {
        name: 'Mike Wilson',
        email: 'mike.wilson@email.com',
        phone: '+1 (555) 234-5678'
      },
      type: 'Sale',
      amount: 450000,
      commission: 22500,
      status: 'Pending',
      dateCreated: new Date('2024-01-20'),
      deadline: new Date('2024-02-05')
    },
    {
      id: 'CT-003',
      reference: 'REF-2024-003',
      property: {
        title: 'Luxury Waterfront Condo',
        address: '789 Beach Road, Marina'
      },
      client: {
        name: 'Emma Davis',
        email: 'emma.davis@email.com',
        phone: '+1 (555) 345-6789'
      },
      type: 'Sale',
      amount: 750000,
      commission: 37500,
      status: 'Draft',
      dateCreated: new Date('2024-01-25'),
      deadline: new Date('2024-02-10')
    },
    {
      id: 'CT-004',
      reference: 'REF-2024-004',
      property: {
        title: 'Cozy Studio Apartment',
        address: '321 College Street, Campus'
      },
      client: {
        name: 'Robert Chen',
        email: 'robert.chen@email.com',
        phone: '+1 (555) 456-7890'
      },
      type: 'Rent',
      amount: 1200,
      commission: 120,
      status: 'Active',
      dateCreated: new Date('2024-01-10'),
      deadline: null
    },
    {
      id: 'CT-005',
      reference: 'REF-2024-005',
      property: {
        title: 'Commercial Office Space',
        address: '555 Business District, Central'
      },
      client: {
        name: 'Tech Solutions Inc.',
        email: 'contact@techsolutions.com',
        phone: '+1 (555) 567-8901'
      },
      type: 'Lease',
      amount: 5000,
      commission: 500,
      status: 'Cancelled',
      dateCreated: new Date('2024-01-05'),
      deadline: null
    }
  ];

  recentActivity = [
    {
      type: 'signed',
      title: 'Contract Signed',
      description: 'Client has successfully signed the rental agreement',
      contractId: 'CT-001',
      time: '2 hours ago'
    },
    {
      type: 'created',
      title: 'New Contract Created',
      description: 'Created new sale contract for luxury waterfront condo',
      contractId: 'CT-003',
      time: '1 day ago'
    },
    {
      type: 'sent',
      title: 'Contract Sent for Review',
      description: 'Sent contract to client for review and signature',
      contractId: 'CT-002',
      time: '2 days ago'
    },
    {
      type: 'updated',
      title: 'Contract Updated',
      description: 'Updated terms and conditions based on client feedback',
      contractId: 'CT-002',
      time: '3 days ago'
    }
  ];

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'draft': return 'secondary';
      default: return 'secondary';
    }
  }
}