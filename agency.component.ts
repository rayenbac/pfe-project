import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agency',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="agency-management">
      <div class="agency-header">
        <h1>Agency Management</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Import Data</button>
          <button class="btn btn-primary">+ Create Agency</button>
        </div>
      </div>

      <div class="agency-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'my-agency'" (click)="setActiveTab('my-agency')">
          My Agency
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'join-agency'" (click)="setActiveTab('join-agency')">
          Join Agency
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'create-agency'" (click)="setActiveTab('create-agency')">
          Create Agency
        </button>
      </div>

      <!-- My Agency Tab -->
      <div class="tab-content" *ngIf="activeTab === 'my-agency'">
        <div class="my-agency-section" *ngIf="currentAgency; else noAgency">
          <div class="agency-card-large">
            <div class="agency-header-section">
              <div class="agency-logo-large">
                <img [src]="currentAgency.logo" [alt]="currentAgency.name">
              </div>
              <div class="agency-info">
                <h2 class="agency-name">{{ currentAgency.name }}</h2>
                <p class="agency-tagline">{{ currentAgency.tagline }}</p>
                <div class="agency-stats-row">
                  <div class="stat-item">
                    <span class="stat-number">{{ currentAgency.agentCount }}</span>
                    <span class="stat-label">Agents</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ currentAgency.propertiesCount }}</span>
                    <span class="stat-label">Properties</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ currentAgency.rating }}</span>
                    <span class="stat-label">★ Rating</span>
                  </div>
                </div>
              </div>
              <div class="agency-actions">
                <button class="btn btn-outline">Edit Info</button>
                <button class="btn btn-primary">Manage</button>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-8">
              <div class="card">
                <div class="card-header">
                  <h3>Agency Team</h3>
                  <button class="btn btn-outline btn-sm">+ Invite Agent</button>
                </div>
                <div class="team-grid">
                  <div class="team-member" *ngFor="let member of currentAgency.team">
                    <div class="member-avatar">
                      <img [src]="member.avatar" [alt]="member.name">
                      <div class="member-status" [class.online]="member.isOnline"></div>
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.name }}</div>
                      <div class="member-role">{{ member.role }}</div>
                      <div class="member-stats">
                        <span class="stat">{{ member.deals }} deals</span>
                        <span class="stat">{{ member.rating }}★</span>
                      </div>
                    </div>
                    <div class="member-actions">
                      <button class="action-btn">📧</button>
                      <button class="action-btn">📞</button>
                      <button class="action-btn">⚙️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-4">
              <div class="card">
                <div class="card-header">
                  <h3>Performance</h3>
                </div>
                <div class="performance-metrics">
                  <div class="metric">
                    <div class="metric-label">Monthly Sales</div>
                    <div class="metric-value">{{ currentAgency.monthlySales | currency }}</div>
                    <div class="metric-change positive">+12.5%</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Active Listings</div>
                    <div class="metric-value">{{ currentAgency.activeListings }}</div>
                    <div class="metric-change positive">+8.3%</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Client Satisfaction</div>
                    <div class="metric-value">{{ currentAgency.clientSatisfaction }}%</div>
                    <div class="metric-change positive">+2.1%</div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-header">
                  <h3>Recent Activity</h3>
                </div>
                <div class="activity-feed">
                  <div class="activity-item" *ngFor="let activity of agencyActivity">
                    <div class="activity-icon">{{ activity.icon }}</div>
                    <div class="activity-content">
                      <div class="activity-text">{{ activity.text }}</div>
                      <div class="activity-time">{{ activity.time }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noAgency>
          <div class="no-agency-state">
            <div class="no-agency-icon">🏢</div>
            <h3>No Agency Associated</h3>
            <p>You are not currently associated with any agency. Join an existing agency or create your own to get started.</p>
            <div class="no-agency-actions">
              <button class="btn btn-outline" (click)="setActiveTab('join-agency')">Join Agency</button>
              <button class="btn btn-primary" (click)="setActiveTab('create-agency')">Create Agency</button>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Join Agency Tab -->
      <div class="tab-content" *ngIf="activeTab === 'join-agency'">
        <div class="join-agency-section">
          <div class="search-section">
            <div class="search-header">
              <h2>Find Your Perfect Agency</h2>
              <p>Browse and join established real estate agencies in your area</p>
            </div>
            
            <div class="search-filters">
              <div class="filter-group">
                <input type="text" class="form-control" placeholder="Search agencies by name, location...">
              </div>
              <div class="filter-group">
                <select class="form-control">
                  <option>All Locations</option>
                  <option>Downtown</option>
                  <option>Suburbs</option>
                  <option>Waterfront</option>
                </select>
              </div>
              <div class="filter-group">
                <select class="form-control">
                  <option>All Sizes</option>
                  <option>Small (1-10 agents)</option>
                  <option>Medium (11-50 agents)</option>
                  <option>Large (50+ agents)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="agencies-list">
            <div class="agency-card" *ngFor="let agency of availableAgencies">
              <div class="agency-card-header">
                <div class="agency-logo">
                  <img [src]="agency.logo" [alt]="agency.name">
                </div>
                <div class="agency-basic-info">
                  <h3 class="agency-name">{{ agency.name }}</h3>
                  <div class="agency-location">{{ agency.location }}</div>
                  <div class="agency-rating">{{ agency.rating }} ★ ({{ agency.reviews }} reviews)</div>
                </div>
                <div class="join-actions">
                  <button class="btn btn-outline btn-sm">View Details</button>
                  <button class="btn btn-primary btn-sm">Request to Join</button>
                </div>
              </div>
              
              <div class="agency-details">
                <div class="agency-stats">
                  <div class="stat">
                    <span class="stat-number">{{ agency.agentCount }}</span>
                    <span class="stat-label">Agents</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ agency.totalSales | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span class="stat-label">Annual Sales</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">{{ agency.founded }}</span>
                    <span class="stat-label">Founded</span>
                  </div>
                </div>
                
                <div class="agency-description">
                  <p>{{ agency.description }}</p>
                </div>
                
                <div class="agency-specialties">
                  <span class="specialty-tag" *ngFor="let specialty of agency.specialties">
                    {{ specialty }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Agency Tab -->
      <div class="tab-content" *ngIf="activeTab === 'create-agency'">
        <div class="create-agency-section">
          <div class="form-header">
            <h2>Create Your Own Agency</h2>
            <p>Start your own real estate agency and build your team</p>
          </div>

          <form class="agency-form">
            <div class="row">
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Agency Name *</label>
                  <input type="text" class="form-control" placeholder="Enter agency name">
                </div>
              </div>
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Tagline</label>
                  <input type="text" class="form-control" placeholder="Your agency's motto or tagline">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea class="form-control" rows="4" placeholder="Describe your agency's mission, values, and services"></textarea>
            </div>

            <div class="row">
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Phone Number *</label>
                  <input type="tel" class="form-control" placeholder="+1 (555) 123-4567">
                </div>
              </div>
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-control" placeholder="contact@youragency.com">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Office Address *</label>
              <input type="text" class="form-control" placeholder="123 Business Street, City, State, ZIP">
            </div>

            <div class="row">
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Website</label>
                  <input type="url" class="form-control" placeholder="https://www.youragency.com">
                </div>
              </div>
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">License Number</label>
                  <input type="text" class="form-control" placeholder="Real estate license number">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Specialties</label>
              <div class="specialties-selector">
                <div class="specialty-option" *ngFor="let specialty of specialtyOptions">
                  <input type="checkbox" [id]="specialty.id" [value]="specialty.value">
                  <label [for]="specialty.id">{{ specialty.label }}</label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Agency Logo</label>
              <div class="file-upload">
                <div class="upload-area">
                  <div class="upload-icon">📁</div>
                  <div class="upload-text">
                    <strong>Click to upload</strong> or drag and drop
                  </div>
                  <div class="upload-hint">PNG, JPG up to 2MB</div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline">Save as Draft</button>
              <button type="submit" class="btn btn-primary">Create Agency</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agency-management {
      padding: 2rem;
    }

    .agency-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .agency-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid var(--border);
    }

    .tab-btn {
      padding: 1rem 2rem;
      border: none;
      background: transparent;
      color: #666;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
    }

    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-btn:hover {
      color: var(--primary);
      background: rgba(255, 90, 95, 0.1);
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* My Agency Styles */
    .agency-card-large {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .agency-header-section {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .agency-logo-large img {
      width: 100px;
      height: 100px;
      border-radius: 16px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .agency-info {
      flex: 1;
    }

    .agency-name {
      font-size: 2rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .agency-tagline {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .agency-stats-row {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    .agency-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .team-grid {
      padding: 1rem;
    }

    .team-member {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .team-member:last-child {
      border-bottom: none;
    }

    .member-avatar {
      position: relative;
    }

    .member-avatar img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .member-status {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #dc3545;
      border: 3px solid white;
    }

    .member-status.online {
      background: #28a745;
    }

    .member-info {
      flex: 1;
    }

    .member-name {
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .member-role {
      color: var(--primary);
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .member-stats {
      display: flex;
      gap: 1rem;
    }

    .stat {
      font-size: 0.875rem;
      color: #666;
    }

    .member-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
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
      transform: scale(1.1);
    }

    .performance-metrics {
      padding: 1rem;
    }

    .metric {
      margin-bottom: 1.5rem;
    }

    .metric:last-child {
      margin-bottom: 0;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .metric-change {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .metric-change.positive {
      color: #28a745;
    }

    .metric-change.negative {
      color: #dc3545;
    }

    .activity-feed {
      padding: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .activity-item:last-child {
      margin-bottom: 0;
    }

    .activity-icon {
      font-size: 1.5rem;
      width: 40px;
      text-align: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      font-size: 0.875rem;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.75rem;
      color: #999;
    }

    .no-agency-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .no-agency-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-agency-state h3 {
      color: var(--secondary);
      margin-bottom: 1rem;
    }

    .no-agency-state p {
      color: #666;
      margin-bottom: 2rem;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .no-agency-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    /* Join Agency Styles */
    .join-agency-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .search-section {
      padding: 2rem;
      border-bottom: 1px solid var(--border);
    }

    .search-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .search-header h2 {
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .search-header p {
      color: #666;
    }

    .search-filters {
      display: flex;
      gap: 1rem;
    }

    .filter-group {
      flex: 1;
    }

    .agencies-list {
      padding: 2rem;
    }

    .agency-card {
      background: var(--accent);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    .agency-card:hover {
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transform: translateY(-4px);
    }

    .agency-card-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .agency-logo img {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      object-fit: cover;
    }

    .agency-basic-info {
      flex: 1;
    }

    .agency-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .agency-location {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .agency-rating {
      color: var(--primary);
      font-weight: 500;
      font-size: 0.875rem;
    }

    .join-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .agency-details {
      padding-left: 75px;
    }

    .agency-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-weight: 600;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    .agency-description {
      margin-bottom: 1rem;
    }

    .agency-description p {
      color: #666;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .agency-specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-tag {
      padding: 0.25rem 0.75rem;
      background: var(--primary);
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    /* Create Agency Styles */
    .create-agency-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-header h2 {
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .form-header p {
      color: #666;
    }

    .agency-form {
      max-width: 800px;
      margin: 0 auto;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--secondary);
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(255, 90, 95, 0.1);
    }

    .specialties-selector {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
    }

    .specialty-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .specialty-option input[type="checkbox"] {
      width: 16px;
      height: 16px;
    }

    .specialty-option label {
      font-size: 0.875rem;
      color: var(--secondary);
      cursor: pointer;
    }

    .file-upload {
      border: 2px dashed var(--border);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .file-upload:hover {
      border-color: var(--primary);
      background: rgba(255, 90, 95, 0.05);
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-text {
      margin-bottom: 0.5rem;
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #666;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 1024px) {
      .agency-header-section {
        flex-direction: column;
        text-align: center;
      }

      .agency-stats-row {
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .agency-management {
        padding: 1rem;
      }

      .agency-tabs {
        flex-direction: column;
      }

      .search-filters {
        flex-direction: column;
      }

      .agency-card-header {
        flex-direction: column;
        text-align: center;
      }

      .agency-details {
        padding-left: 0;
      }

      .agency-stats {
        justify-content: center;
      }

      .join-actions {
        flex-direction: row;
        justify-content: center;
      }

      .form-actions {
        flex-direction: column;
      }

      .no-agency-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class AgencyComponent {
  activeTab: 'my-agency' | 'join-agency' | 'create-agency' = 'my-agency';

  // Mock data for current agency (null means no agency)
  currentAgency = {
    name: 'Premier Properties International',
    tagline: 'Excellence in Real Estate Since 1985',
    logo: 'https://images.pexels.com/photos/518244/pexels-photo-518244.jpeg?auto=compress&cs=tinysrgb&w=200',
    agentCount: 45,
    propertiesCount: 230,
    rating: 4.8,
    monthlySales: 2500000,
    activeListings: 89,
    clientSatisfaction: 96,
    team: [
      {
        name: 'Sarah Mitchell',
        role: 'Senior Agent',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
        deals: 45,
        rating: 4.9,
        isOnline: true
      },
      {
        name: 'Michael Chen',
        role: 'Commercial Specialist',
        avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100',
        deals: 32,
        rating: 4.7,
        isOnline: false
      },
      {
        name: 'Emily Rodriguez',
        role: 'Residential Agent',
        avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100',
        deals: 28,
        rating: 4.8,
        isOnline: true
      }
    ]
  };

  agencyActivity = [
    { icon: '🏡', text: 'New property listed on Main Street', time: '2 hours ago' },
    { icon: '✅', text: 'Contract signed for Waterfront Condo', time: '4 hours ago' },
    { icon: '👥', text: 'New agent joined the team', time: '1 day ago' },
    { icon: '💰', text: 'Monthly sales target achieved', time: '2 days ago' }
  ];

  availableAgencies = [
    {
      name: 'Metro Realty Group',
      location: 'Downtown Business District',
      logo: 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.6,
      reviews: 234,
      agentCount: 28,
      totalSales: 15000000,
      founded: 1998,
      description: 'A modern real estate agency focused on innovative marketing strategies and client satisfaction.',
      specialties: ['Residential', 'Commercial', 'Property Management']
    },
    {
      name: 'Coastal Properties LLC',
      location: 'Waterfront Marina District',
      logo: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.9,
      reviews: 189,
      agentCount: 15,
      totalSales: 8500000,
      founded: 2005,
      description: 'Specializing in luxury waterfront properties and vacation homes along the coast.',
      specialties: ['Luxury', 'Waterfront', 'Vacation Rentals']
    },
    {
      name: 'Family First Realty',
      location: 'Suburban Family Communities',
      logo: 'https://images.pexels.com/photos/302769/pexels-photo-302769.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.7,
      reviews: 312,
      agentCount: 35,
      totalSales: 12000000,
      founded: 1995,
      description: 'Dedicated to helping families find their perfect homes in safe, community-oriented neighborhoods.',
      specialties: ['Family Homes', 'First-Time Buyers', 'School Districts']
    }
  ];

  specialtyOptions = [
    { id: 'residential', value: 'residential', label: 'Residential Sales' },
    { id: 'commercial', value: 'commercial', label: 'Commercial Properties' },
    { id: 'luxury', value: 'luxury', label: 'Luxury Homes' },
    { id: 'investment', value: 'investment', label: 'Investment Properties' },
    { id: 'rental', value: 'rental', label: 'Rental Management' },
    { id: 'new-construction', value: 'new-construction', label: 'New Construction' },
    { id: 'land', value: 'land', label: 'Land & Development' },
    { id: 'relocation', value: 'relocation', label: 'Relocation Services' }
  ];

  setActiveTab(tab: 'my-agency' | 'join-agency' | 'create-agency') {
    this.activeTab = tab;
  }
}