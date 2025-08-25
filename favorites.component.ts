import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="favorites">
      <div class="favorites-header">
        <h1>My Favorites</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Export List</button>
          <button class="btn btn-primary">+ Add to Collection</button>
        </div>
      </div>

      <div class="favorites-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'properties'" (click)="setActiveTab('properties')">
          Properties ({{ favoriteProperties.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'agents'" (click)="setActiveTab('agents')">
          Agents ({{ favoriteAgents.length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'agencies'" (click)="setActiveTab('agencies')">
          Agencies ({{ favoriteAgencies.length }})
        </button>
      </div>

      <!-- Properties Tab -->
      <div class="tab-content" *ngIf="activeTab === 'properties'">
        <div class="properties-filters">
          <div class="filter-group">
            <select class="form-control">
              <option>All Types</option>
              <option>House</option>
              <option>Apartment</option>
              <option>Condo</option>
              <option>Commercial</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="form-control">
              <option>All Prices</option>
              <option>Under $500K</option>
              <option>$500K - $1M</option>
              <option>Over $1M</option>
            </select>
          </div>
          <div class="filter-group">
            <input type="text" class="form-control" placeholder="Search properties...">
          </div>
        </div>

        <div class="properties-grid">
          <div class="property-card" *ngFor="let property of favoriteProperties">
            <div class="property-image">
              <img [src]="property.image" [alt]="property.title">
              <div class="favorite-badge">❤️</div>
              <div class="property-actions">
                <button class="action-btn">📤</button>
                <button class="action-btn">📞</button>
                <button class="action-btn">❌</button>
              </div>
            </div>
            
            <div class="property-content">
              <div class="property-price">{{ property.price | currency }}</div>
              <h3 class="property-title">{{ property.title }}</h3>
              <div class="property-address">{{ property.address }}</div>
              
              <div class="property-features">
                <div class="feature">
                  <span class="feature-icon">🛏️</span>
                  <span>{{ property.bedrooms }} beds</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">🚿</span>
                  <span>{{ property.bathrooms }} baths</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">📐</span>
                  <span>{{ property.area }} sqft</span>
                </div>
              </div>

              <div class="property-meta">
                <div class="added-date">Added {{ property.dateAdded | date:'short' }}</div>
                <div class="property-status" [ngClass]="'status-' + property.status.toLowerCase().replace(' ', '-')">
                  {{ property.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Agents Tab -->
      <div class="tab-content" *ngIf="activeTab === 'agents'">
        <div class="agents-filters">
          <div class="filter-group">
            <select class="form-control">
              <option>All Specialties</option>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Luxury</option>
              <option>Investment</option>
            </select>
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
            <input type="text" class="form-control" placeholder="Search agents...">
          </div>
        </div>

        <div class="agents-grid">
          <div class="agent-card" *ngFor="let agent of favoriteAgents">
            <div class="agent-header">
              <div class="agent-avatar">
                <img [src]="agent.avatar" [alt]="agent.name">
                <div class="online-status" [class.online]="agent.isOnline"></div>
              </div>
              <div class="favorite-badge">❤️</div>
            </div>
            
            <div class="agent-content">
              <h3 class="agent-name">{{ agent.name }}</h3>
              <div class="agent-title">{{ agent.title }}</div>
              <div class="agent-company">{{ agent.company }}</div>
              
              <div class="agent-stats">
                <div class="stat">
                  <div class="stat-number">{{ agent.rating }}</div>
                  <div class="stat-label">★ Rating</div>
                </div>
                <div class="stat">
                  <div class="stat-number">{{ agent.deals }}</div>
                  <div class="stat-label">Deals</div>
                </div>
                <div class="stat">
                  <div class="stat-number">{{ agent.experience }}</div>
                  <div class="stat-label">Years</div>
                </div>
              </div>

              <div class="agent-specialties">
                <span class="specialty" *ngFor="let specialty of agent.specialties">
                  {{ specialty }}
                </span>
              </div>

              <div class="agent-contact">
                <div class="contact-item">
                  <span class="icon">📧</span>
                  <span>{{ agent.email }}</span>
                </div>
                <div class="contact-item">
                  <span class="icon">📞</span>
                  <span>{{ agent.phone }}</span>
                </div>
              </div>

              <div class="agent-actions">
                <button class="btn btn-outline btn-sm">Message</button>
                <button class="btn btn-primary btn-sm">Contact</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Agencies Tab -->
      <div class="tab-content" *ngIf="activeTab === 'agencies'">
        <div class="agencies-filters">
          <div class="filter-group">
            <select class="form-control">
              <option>All Sizes</option>
              <option>Small (1-10 agents)</option>
              <option>Medium (11-50 agents)</option>
              <option>Large (50+ agents)</option>
            </select>
          </div>
          <div class="filter-group">
            <select class="form-control">
              <option>All Types</option>
              <option>Full Service</option>
              <option>Discount Brokerage</option>
              <option>Luxury Specialist</option>
            </select>
          </div>
          <div class="filter-group">
            <input type="text" class="form-control" placeholder="Search agencies...">
          </div>
        </div>

        <div class="agencies-grid">
          <div class="agency-card" *ngFor="let agency of favoriteAgencies">
            <div class="agency-header">
              <div class="agency-logo">
                <img [src]="agency.logo" [alt]="agency.name">
              </div>
              <div class="favorite-badge">❤️</div>
            </div>
            
            <div class="agency-content">
              <h3 class="agency-name">{{ agency.name }}</h3>
              <div class="agency-tagline">{{ agency.tagline }}</div>
              
              <div class="agency-stats">
                <div class="stat-row">
                  <div class="stat">
                    <span class="stat-label">Agents:</span>
                    <span class="stat-value">{{ agency.agentCount }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Rating:</span>
                    <span class="stat-value">{{ agency.rating }} ★</span>
                  </div>
                </div>
                <div class="stat-row">
                  <div class="stat">
                    <span class="stat-label">Founded:</span>
                    <span class="stat-value">{{ agency.founded }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Sales:</span>
                    <span class="stat-value">{{ agency.totalSales | currency }}</span>
                  </div>
                </div>
              </div>

              <div class="agency-services">
                <h4>Services</h4>
                <div class="services-list">
                  <span class="service" *ngFor="let service of agency.services">
                    {{ service }}
                  </span>
                </div>
              </div>

              <div class="agency-contact">
                <div class="contact-item">
                  <span class="icon">📍</span>
                  <span>{{ agency.address }}</span>
                </div>
                <div class="contact-item">
                  <span class="icon">📞</span>
                  <span>{{ agency.phone }}</span>
                </div>
                <div class="contact-item">
                  <span class="icon">🌐</span>
                  <span>{{ agency.website }}</span>
                </div>
              </div>

              <div class="agency-actions">
                <button class="btn btn-outline btn-sm">Visit Website</button>
                <button class="btn btn-primary btn-sm">Contact Agency</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collections -->
      <div class="collections-section">
        <div class="card">
          <div class="card-header">
            <h3>My Collections</h3>
            <button class="btn btn-outline btn-sm">+ New Collection</button>
          </div>
          <div class="collections-grid">
            <div class="collection-card" *ngFor="let collection of collections">
              <div class="collection-header">
                <div class="collection-icon">{{ collection.icon }}</div>
                <div class="collection-count">{{ collection.count }}</div>
              </div>
              <div class="collection-content">
                <h4 class="collection-name">{{ collection.name }}</h4>
                <div class="collection-description">{{ collection.description }}</div>
                <div class="collection-updated">Updated {{ collection.lastUpdated | date:'short' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .favorites {
      padding: 2rem;
    }

    .favorites-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .favorites-tabs {
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

    .properties-filters,
    .agents-filters,
    .agencies-filters {
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

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .property-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .property-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .property-image {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .property-card:hover .property-image img {
      transform: scale(1.05);
    }

    .favorite-badge {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      animation: heartbeat 2s ease-in-out infinite;
    }

    @keyframes heartbeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .property-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease;
    }

    .property-card:hover .property-actions {
      opacity: 1;
      transform: translateX(0);
    }

    .action-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: var(--primary);
      color: white;
      transform: scale(1.1);
    }

    .property-content {
      padding: 1.5rem;
    }

    .property-price {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .property-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .property-address {
      color: #666;
      margin-bottom: 1rem;
    }

    .property-features {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }

    .feature-icon {
      font-size: 1rem;
    }

    .property-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .added-date {
      font-size: 0.875rem;
      color: #666;
    }

    .property-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-for-sale {
      background: #28a745;
      color: white;
    }

    .status-for-rent {
      background: #17a2b8;
      color: white;
    }

    .status-sold {
      background: #dc3545;
      color: white;
    }

    /* Agents Grid */
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .agent-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .agent-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .agent-header {
      position: relative;
      padding: 2rem 1.5rem 1rem;
      background: linear-gradient(135deg, var(--primary), #ff7478);
      text-align: center;
    }

    .agent-avatar {
      position: relative;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .agent-avatar img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 4px solid white;
      object-fit: cover;
    }

    .online-status {
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #dc3545;
      border: 3px solid white;
    }

    .online-status.online {
      background: #28a745;
    }

    .agent-content {
      padding: 1.5rem;
    }

    .agent-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .agent-title {
      color: var(--primary);
      font-weight: 500;
      text-align: center;
      margin-bottom: 0.25rem;
    }

    .agent-company {
      color: #666;
      font-size: 0.875rem;
      text-align: center;
      margin-bottom: 1rem;
    }

    .agent-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    .agent-specialties {
      margin-bottom: 1rem;
    }

    .specialty {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--accent);
      color: var(--primary);
      border-radius: 20px;
      font-size: 0.875rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .agent-contact {
      margin-bottom: 1rem;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }

    .icon {
      width: 20px;
    }

    .agent-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Agencies Grid */
    .agencies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .agency-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .agency-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .agency-header {
      position: relative;
      padding: 2rem 1.5rem;
      background: var(--accent);
      text-align: center;
    }

    .agency-logo img {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .agency-content {
      padding: 1.5rem;
    }

    .agency-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .agency-tagline {
      color: #666;
      text-align: center;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .agency-stats {
      margin-bottom: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .stat-row:last-child {
      margin-bottom: 0;
    }

    .stat {
      display: flex;
      gap: 0.5rem;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
    }

    .stat-value {
      color: var(--secondary);
      font-weight: 500;
      font-size: 0.875rem;
    }

    .agency-services {
      margin-bottom: 1rem;
    }

    .agency-services h4 {
      font-size: 1rem;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .services-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .service {
      padding: 0.25rem 0.75rem;
      background: var(--accent);
      color: var(--primary);
      border-radius: 20px;
      font-size: 0.875rem;
    }

    .agency-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Collections */
    .collections-section {
      margin-top: 2rem;
    }

    .collections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .collection-card {
      background: var(--accent);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .collection-card:hover {
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transform: translateY(-4px);
    }

    .collection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .collection-icon {
      font-size: 2rem;
    }

    .collection-count {
      background: var(--primary);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .collection-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .collection-description {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .collection-updated {
      color: #999;
      font-size: 0.75rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    @media (max-width: 1024px) {
      .properties-grid,
      .agents-grid,
      .agencies-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .favorites-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .favorites-tabs {
        flex-direction: column;
      }

      .tab-btn {
        text-align: left;
      }

      .properties-filters,
      .agents-filters,
      .agencies-filters {
        flex-direction: column;
      }

      .properties-grid,
      .agents-grid,
      .agencies-grid {
        grid-template-columns: 1fr;
      }

      .collections-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FavoritesComponent {
  activeTab: 'properties' | 'agents' | 'agencies' = 'properties';

  favoriteProperties = [
    {
      id: 1,
      title: 'Modern Downtown Apartment',
      address: '123 Main Street, Downtown',
      price: 2500,
      image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      status: 'For Rent',
      dateAdded: new Date('2024-01-15')
    },
    {
      id: 2,
      title: 'Luxury Waterfront Condo',
      address: '789 Beach Road, Marina',
      price: 750000,
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      status: 'For Sale',
      dateAdded: new Date('2024-01-20')
    },
    {
      id: 3,
      title: 'Spacious Family House',
      address: '456 Oak Avenue, Suburbs',
      price: 450000,
      image: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 4,
      bathrooms: 3,
      area: 2800,
      status: 'For Sale',
      dateAdded: new Date('2024-01-10')
    }
  ];

  favoriteAgents = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      title: 'Senior Real Estate Agent',
      company: 'Premier Properties',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.9,
      deals: 127,
      experience: 8,
      specialties: ['Luxury Homes', 'Waterfront', 'Investment'],
      email: 'sarah@premierproperties.com',
      phone: '+1 (555) 123-4567',
      isOnline: true
    },
    {
      id: 2,
      name: 'Michael Chen',
      title: 'Commercial Real Estate Specialist',
      company: 'Metro Realty Group',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.8,
      deals: 89,
      experience: 12,
      specialties: ['Commercial', 'Investment', 'Development'],
      email: 'michael@metrorealty.com',
      phone: '+1 (555) 234-5678',
      isOnline: false
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'First-Time Buyer Specialist',
      company: 'Family First Realty',
      avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 4.7,
      deals: 156,
      experience: 6,
      specialties: ['First-Time Buyers', 'Residential', 'Condos'],
      email: 'emily@familyfirstrealty.com',
      phone: '+1 (555) 345-6789',
      isOnline: true
    }
  ];

  favoriteAgencies = [
    {
      id: 1,
      name: 'Premier Properties International',
      tagline: 'Excellence in Real Estate Since 1985',
      logo: 'https://images.pexels.com/photos/518244/pexels-photo-518244.jpeg?auto=compress&cs=tinysrgb&w=200',
      agentCount: 45,
      rating: 4.8,
      founded: 1985,
      totalSales: 125000000,
      services: ['Residential Sales', 'Commercial', 'Property Management', 'Investment Advisory'],
      address: '123 Business Plaza, Downtown',
      phone: '+1 (555) 111-2222',
      website: 'www.premierproperties.com'
    },
    {
      id: 2,
      name: 'Coastal Realty Group',
      tagline: 'Your Gateway to Waterfront Living',
      logo: 'https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=200',
      agentCount: 28,
      rating: 4.9,
      founded: 1992,
      totalSales: 89000000,
      services: ['Waterfront Properties', 'Luxury Homes', 'Vacation Rentals'],
      address: '456 Marina Boulevard, Waterfront',
      phone: '+1 (555) 333-4444',
      website: 'www.coastalrealty.com'
    }
  ];

  collections = [
    {
      name: 'Dream Homes',
      description: 'My ultimate wish list of luxury properties',
      icon: '🏰',
      count: 12,
      lastUpdated: new Date('2024-01-22')
    },
    {
      name: 'Investment Opportunities',
      description: 'Properties with great ROI potential',
      icon: '💰',
      count: 8,
      lastUpdated: new Date('2024-01-20')
    },
    {
      name: 'Client Matches',
      description: 'Properties that match my clients needs',
      icon: '🎯',
      count: 15,
      lastUpdated: new Date('2024-01-25')
    },
    {
      name: 'Market Research',
      description: 'Properties for competitive analysis',
      icon: '📊',
      count: 6,
      lastUpdated: new Date('2024-01-18')
    }
  ];

  setActiveTab(tab: 'properties' | 'agents' | 'agencies') {
    this.activeTab = tab;
  }
}