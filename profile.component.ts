import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-settings">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Export Data</button>
          <button class="btn btn-primary">Save Changes</button>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-main">
          <div class="profile-card">
            <div class="profile-avatar-section">
              <div class="avatar-container">
                <img [src]="userProfile.avatar" [alt]="userProfile.name" class="profile-avatar">
                <button class="avatar-edit-btn">📷</button>
              </div>
              <div class="avatar-info">
                <h2>{{ userProfile.name }}</h2>
                <p class="profile-role">{{ userProfile.role }}</p>
                <div class="profile-stats">
                  <div class="stat-item">
                    <span class="stat-number">{{ userProfile.yearsExperience }}</span>
                    <span class="stat-label">Years Experience</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ userProfile.totalDeals }}</span>
                    <span class="stat-label">Total Deals</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-number">{{ userProfile.rating }}</span>
                    <span class="stat-label">★ Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-tabs">
            <button class="tab-btn" [class.active]="activeTab === 'personal'" (click)="setActiveTab('personal')">
              Personal Info
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'professional'" (click)="setActiveTab('professional')">
              Professional
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'security'" (click)="setActiveTab('security')">
              Security
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'notifications'" (click)="setActiveTab('notifications')">
              Notifications
            </button>
          </div>

          <!-- Personal Info Tab -->
          <div class="tab-content" *ngIf="activeTab === 'personal'">
            <div class="settings-section">
              <h3>Personal Information</h3>
              <form class="settings-form">
                <div class="row">
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">First Name *</label>
                      <input type="text" class="form-control" [value]="userProfile.firstName">
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">Last Name *</label>
                      <input type="text" class="form-control" [value]="userProfile.lastName">
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">Email Address *</label>
                      <input type="email" class="form-control" [value]="userProfile.email">
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">Phone Number *</label>
                      <input type="tel" class="form-control" [value]="userProfile.phone">
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Address</label>
                  <input type="text" class="form-control" [value]="userProfile.address">
                </div>

                <div class="row">
                  <div class="col-4">
                    <div class="form-group">
                      <label class="form-label">City</label>
                      <input type="text" class="form-control" [value]="userProfile.city">
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-group">
                      <label class="form-label">State</label>
                      <select class="form-control">
                        <option>California</option>
                        <option>New York</option>
                        <option>Texas</option>
                        <option>Florida</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-group">
                      <label class="form-label">ZIP Code</label>
                      <input type="text" class="form-control" [value]="userProfile.zipCode">
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Bio</label>
                  <textarea class="form-control" rows="4" [value]="userProfile.bio"></textarea>
                </div>
              </form>
            </div>
          </div>

          <!-- Professional Tab -->
          <div class="tab-content" *ngIf="activeTab === 'professional'">
            <div class="settings-section">
              <h3>Professional Information</h3>
              <form class="settings-form">
                <div class="row">
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">License Number *</label>
                      <input type="text" class="form-control" [value]="userProfile.licenseNumber">
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">License State *</label>
                      <select class="form-control">
                        <option>California</option>
                        <option>New York</option>
                        <option>Texas</option>
                        <option>Florida</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">Years of Experience</label>
                      <input type="number" class="form-control" [value]="userProfile.yearsExperience">
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-group">
                      <label class="form-label">Brokerage</label>
                      <input type="text" class="form-control" [value]="userProfile.brokerage">
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Specializations</label>
                  <div class="specializations-grid">
                    <div class="specialization-item" *ngFor="let spec of specializations">
                      <input type="checkbox" [id]="spec.id" [checked]="spec.selected">
                      <label [for]="spec.id">{{ spec.label }}</label>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Service Areas</label>
                  <div class="service-areas">
                    <div class="area-tag" *ngFor="let area of serviceAreas">
                      {{ area }}
                      <button class="remove-tag">×</button>
                    </div>
                    <input type="text" class="area-input" placeholder="Add service area">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Languages</label>
                  <div class="languages-selector">
                    <select class="form-control">
                      <option>Select Language</option>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Chinese</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                  <div class="selected-languages">
                    <span class="language-tag" *ngFor="let lang of languages">
                      {{ lang }}
                      <button class="remove-tag">×</button>
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Security Tab -->
          <div class="tab-content" *ngIf="activeTab === 'security'">
            <div class="settings-section">
              <h3>Security Settings</h3>
              
              <div class="security-card">
                <h4>Change Password</h4>
                <form class="password-form">
                  <div class="form-group">
                    <label class="form-label">Current Password *</label>
                    <input type="password" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">New Password *</label>
                    <input type="password" class="form-control">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Confirm New Password *</label>
                    <input type="password" class="form-control">
                  </div>
                  <button type="submit" class="btn btn-primary">Update Password</button>
                </form>
              </div>

              <div class="security-card">
                <h4>Two-Factor Authentication</h4>
                <div class="security-option">
                  <div class="option-info">
                    <div class="option-title">SMS Authentication</div>
                    <div class="option-description">Receive verification codes via SMS</div>
                  </div>
                  <div class="option-toggle">
                    <input type="checkbox" class="toggle-switch" checked>
                  </div>
                </div>
                <div class="security-option">
                  <div class="option-info">
                    <div class="option-title">Email Authentication</div>
                    <div class="option-description">Receive verification codes via email</div>
                  </div>
                  <div class="option-toggle">
                    <input type="checkbox" class="toggle-switch">
                  </div>
                </div>
              </div>

              <div class="security-card">
                <h4>Login Activity</h4>
                <div class="activity-list">
                  <div class="activity-item" *ngFor="let activity of loginActivity">
                    <div class="activity-info">
                      <div class="activity-device">{{ activity.device }}</div>
                      <div class="activity-location">{{ activity.location }}</div>
                      <div class="activity-time">{{ activity.time }}</div>
                    </div>
                    <div class="activity-status" [ngClass]="activity.current ? 'current' : 'past'">
                      {{ activity.current ? 'Current Session' : 'Past Session' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notifications Tab -->
          <div class="tab-content" *ngIf="activeTab === 'notifications'">
            <div class="settings-section">
              <h3>Notification Preferences</h3>
              
              <div class="notification-category">
                <h4>Email Notifications</h4>
                <div class="notification-option" *ngFor="let option of emailNotifications">
                  <div class="option-info">
                    <div class="option-title">{{ option.title }}</div>
                    <div class="option-description">{{ option.description }}</div>
                  </div>
                  <div class="option-toggle">
                    <input type="checkbox" class="toggle-switch" [checked]="option.enabled">
                  </div>
                </div>
              </div>

              <div class="notification-category">
                <h4>Push Notifications</h4>
                <div class="notification-option" *ngFor="let option of pushNotifications">
                  <div class="option-info">
                    <div class="option-title">{{ option.title }}</div>
                    <div class="option-description">{{ option.description }}</div>
                  </div>
                  <div class="option-toggle">
                    <input type="checkbox" class="toggle-switch" [checked]="option.enabled">
                  </div>
                </div>
              </div>

              <div class="notification-category">
                <h4>SMS Notifications</h4>
                <div class="notification-option" *ngFor="let option of smsNotifications">
                  <div class="option-info">
                    <div class="option-title">{{ option.title }}</div>
                    <div class="option-description">{{ option.description }}</div>
                  </div>
                  <div class="option-toggle">
                    <input type="checkbox" class="toggle-switch" [checked]="option.enabled">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-sidebar">
          <div class="card">
            <div class="card-header">
              <h3>Profile Completion</h3>
            </div>
            <div class="completion-content">
              <div class="completion-circle">
                <div class="circle-progress" [style.background]="'conic-gradient(var(--primary) 0deg ' + (profileCompletion * 3.6) + 'deg, var(--border) ' + (profileCompletion * 3.6) + 'deg 360deg)'">
                  <div class="circle-inner">
                    <span class="completion-percentage">{{ profileCompletion }}%</span>
                  </div>
                </div>
              </div>
              <div class="completion-items">
                <div class="completion-item" *ngFor="let item of completionItems">
                  <div class="item-icon" [ngClass]="item.completed ? 'completed' : 'incomplete'">
                    {{ item.completed ? '✅' : '⭕' }}
                  </div>
                  <div class="item-text">{{ item.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions">
              <button class="quick-action-btn">
                <span class="action-icon">📄</span>
                <span class="action-text">Download Resume</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">🔗</span>
                <span class="action-text">Share Profile</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">📊</span>
                <span class="action-text">View Analytics</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-icon">⚙️</span>
                <span class="action-text">Advanced Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-settings {
      padding: 2rem;
    }

    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .profile-content {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 2rem;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .profile-avatar-section {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .avatar-container {
      position: relative;
    }

    .profile-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .avatar-edit-btn {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 36px;
      height: 36px;
      border: none;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }

    .avatar-edit-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
    }

    .avatar-info h2 {
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .profile-role {
      color: var(--primary);
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .profile-stats {
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

    .settings-tabs {
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

    .settings-section {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .settings-section h3 {
      color: var(--secondary);
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .settings-form {
      max-width: 600px;
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

    .specializations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
    }

    .specialization-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .specialization-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
    }

    .specialization-item label {
      font-size: 0.875rem;
      color: var(--secondary);
      cursor: pointer;
    }

    .service-areas {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      padding: 1rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      min-height: 60px;
    }

    .area-tag,
    .language-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: var(--primary);
      color: white;
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .remove-tag {
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }

    .area-input {
      border: none;
      outline: none;
      padding: 0.5rem;
      flex: 1;
      min-width: 100px;
    }

    .selected-languages {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .security-card {
      background: var(--accent);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .security-card h4 {
      color: var(--secondary);
      margin-bottom: 1rem;
    }

    .password-form {
      max-width: 400px;
    }

    .security-option,
    .notification-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .security-option:last-child,
    .notification-option:last-child {
      border-bottom: none;
    }

    .option-info {
      flex: 1;
    }

    .option-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .option-description {
      font-size: 0.875rem;
      color: #666;
    }

    .toggle-switch {
      width: 50px;
      height: 26px;
      -webkit-appearance: none;
      appearance: none;
      background: #ccc;
      border-radius: 13px;
      position: relative;
      cursor: pointer;
      outline: none;
      transition: background 0.3s ease;
    }

    .toggle-switch:checked {
      background: var(--primary);
    }

    .toggle-switch::before {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      background: white;
      transition: transform 0.3s ease;
    }

    .toggle-switch:checked::before {
      transform: translateX(24px);
    }

    .activity-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-device {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.25rem;
    }

    .activity-location,
    .activity-time {
      font-size: 0.875rem;
      color: #666;
    }

    .activity-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .activity-status.current {
      background: #28a745;
      color: white;
    }

    .activity-status.past {
      background: var(--accent);
      color: #666;
    }

    .notification-category {
      margin-bottom: 2rem;
    }

    .notification-category h4 {
      color: var(--secondary);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    .profile-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .completion-content {
      padding: 1rem;
      text-align: center;
    }

    .completion-circle {
      margin-bottom: 1.5rem;
    }

    .circle-progress {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .circle-inner {
      width: 90px;
      height: 90px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .completion-percentage {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .completion-items {
      text-align: left;
    }

    .completion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .item-icon {
      font-size: 1.2rem;
    }

    .item-text {
      font-size: 0.875rem;
      color: var(--secondary);
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

    @media (max-width: 1024px) {
      .profile-content {
        grid-template-columns: 1fr;
      }

      .profile-sidebar {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .profile-settings {
        padding: 1rem;
      }

      .profile-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .profile-avatar-section {
        flex-direction: column;
        text-align: center;
      }

      .profile-stats {
        justify-content: center;
      }

      .settings-tabs {
        flex-wrap: wrap;
      }

      .tab-btn {
        flex: 1;
        min-width: 120px;
      }

      .specializations-grid {
        grid-template-columns: 1fr;
      }

      .security-option,
      .notification-option {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class ProfileComponent {
  activeTab: 'personal' | 'professional' | 'security' | 'notifications' = 'personal';

  userProfile = {
    name: 'John Smith',
    firstName: 'John',
    lastName: 'Smith',
    role: 'Senior Real Estate Agent',
    email: 'john.smith@realestate.com',
    phone: '+1 (555) 123-4567',
    address: '123 Professional Drive',
    city: 'Los Angeles',
    state: 'California',
    zipCode: '90210',
    bio: 'Experienced real estate professional with over 8 years in the industry. Specializing in luxury residential properties and first-time home buyers. Committed to providing exceptional service and achieving the best outcomes for my clients.',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200',
    yearsExperience: 8,
    totalDeals: 145,
    rating: 4.9,
    licenseNumber: 'DRE #01234567',
    brokerage: 'Premier Properties International'
  };

  profileCompletion = 85;

  completionItems = [
    { text: 'Basic Information', completed: true },
    { text: 'Professional Details', completed: true },
    { text: 'Profile Photo', completed: true },
    { text: 'Bio & Description', completed: true },
    { text: 'Certifications', completed: false },
    { text: 'Portfolio Samples', completed: false }
  ];

  specializations = [
    { id: 'residential', label: 'Residential Sales', selected: true },
    { id: 'luxury', label: 'Luxury Properties', selected: true },
    { id: 'first-time', label: 'First-Time Buyers', selected: true },
    { id: 'investment', label: 'Investment Properties', selected: false },
    { id: 'commercial', label: 'Commercial Real Estate', selected: false },
    { id: 'rental', label: 'Rental Management', selected: false }
  ];

  serviceAreas = ['Downtown LA', 'Beverly Hills', 'Santa Monica', 'West Hollywood'];
  languages = ['English', 'Spanish', 'French'];

  loginActivity = [
    {
      device: 'MacBook Pro - Chrome',
      location: 'Los Angeles, CA',
      time: 'Current session',
      current: true
    },
    {
      device: 'iPhone 14 - Safari',
      location: 'Los Angeles, CA',
      time: '2 hours ago',
      current: false
    },
    {
      device: 'Windows PC - Edge',
      location: 'Beverly Hills, CA',
      time: '1 day ago',
      current: false
    }
  ];

  emailNotifications = [
    {
      title: 'New Leads',
      description: 'Get notified when you receive new client inquiries',
      enabled: true
    },
    {
      title: 'Appointment Reminders',
      description: 'Receive reminders for upcoming appointments',
      enabled: true
    },
    {
      title: 'Property Updates',
      description: 'Get updates on your listed properties',
      enabled: true
    },
    {
      title: 'Weekly Reports',
      description: 'Receive weekly performance and analytics reports',
      enabled: false
    },
    {
      title: 'Marketing Tips',
      description: 'Get tips and best practices for real estate marketing',
      enabled: false
    }
  ];

  pushNotifications = [
    {
      title: 'Urgent Messages',
      description: 'Immediate notifications for urgent client messages',
      enabled: true
    },
    {
      title: 'Appointment Changes',
      description: 'Get notified when appointments are rescheduled or cancelled',
      enabled: true
    },
    {
      title: 'New Reviews',
      description: 'Be notified when clients leave reviews',
      enabled: true
    },
    {
      title: 'Market Alerts',
      description: 'Receive alerts about market changes in your areas',
      enabled: false
    }
  ];

  smsNotifications = [
    {
      title: 'Appointment Confirmations',
      description: 'SMS confirmations for scheduled appointments',
      enabled: true
    },
    {
      title: 'Emergency Contacts',
      description: 'SMS notifications for emergency property issues',
      enabled: true
    },
    {
      title: 'Lead Notifications',
      description: 'SMS alerts for high-priority leads',
      enabled: false
    }
  ];

  setActiveTab(tab: 'personal' | 'professional' | 'security' | 'notifications') {
    this.activeTab = tab;
  }
}