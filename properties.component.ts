import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="properties">
      <div class="properties-header">
        <h1>My Properties</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Import Properties</button>
          <button class="btn btn-primary">+ Add Property</button>
        </div>
      </div>

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
            <option>All Status</option>
            <option>For Sale</option>
            <option>For Rent</option>
            <option>Sold</option>
            <option>Rented</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" class="form-control" placeholder="Search properties...">
        </div>
      </div>

      <div class="properties-grid">
        <div class="property-card" *ngFor="let property of properties">
          <div class="property-image">
            <img [src]="property.image" [alt]="property.title">
            <div class="property-status" [ngClass]="'status-' + property.status.toLowerCase().replace(' ', '-')">
              {{ property.status }}
            </div>
            <div class="property-actions">
              <button class="action-btn">Edit</button>
              <button class="action-btn">View</button>
            </div>
          </div>
          
          <div class="property-content">
            <div class="property-price">{{ property.price | currency }}</div>
            <h3 class="property-title">{{ property.title }}</h3>
            <div class="property-address">{{ property.address }}</div>
            
            <div class="property-features">
              <div class="feature">
                <span class="feature-icon">🛏️</span>
                <span class="feature-text">{{ property.bedrooms }} beds</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🚿</span>
                <span class="feature-text">{{ property.bathrooms }} baths</span>
              </div>
              <div class="feature">
                <span class="feature-icon">📐</span>
                <span class="feature-text">{{ property.area }} sqft</span>
              </div>
            </div>
            
            <div class="property-stats">
              <div class="stat">
                <div class="stat-number">{{ property.views }}</div>
                <div class="stat-label">Views</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{ property.inquiries }}</div>
                <div class="stat-label">Inquiries</div>
              </div>
              <div class="stat">
                <div class="stat-number">{{ property.favorites }}</div>
                <div class="stat-label">Favorites</div>
              </div>
            </div>
            
            <div class="property-footer">
              <div class="property-date">Listed {{ property.listedDate }}</div>
              <div class="property-actions-bottom">
                <button class="btn btn-outline btn-sm">Share</button>
                <button class="btn btn-primary btn-sm">Manage</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="properties-pagination">
        <button class="btn btn-outline">Previous</button>
        <div class="page-numbers">
          <span class="page-number active">1</span>
          <span class="page-number">2</span>
          <span class="page-number">3</span>
          <span>...</span>
          <span class="page-number">12</span>
        </div>
        <button class="btn btn-outline">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .properties {
      padding: 2rem;
    }

    .properties-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .properties-filters {
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
      height: 250px;
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

    .property-status {
      position: absolute;
      top: 1rem;
      left: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

    .status-rented {
      background: #ffc107;
      color: white;
    }

    .property-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }

    .property-card:hover .property-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .action-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 20px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: var(--primary);
      color: white;
    }

    .property-content {
      padding: 1.5rem;
    }

    .property-price {
      font-size: 2rem;
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
      margin-bottom: 1.5rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .feature-icon {
      font-size: 1.1rem;
    }

    .feature-text {
      font-size: 0.875rem;
      color: #666;
    }

    .property-stats {
      display: flex;
      justify-content: space-around;
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
    }

    .property-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .property-date {
      font-size: 0.875rem;
      color: #666;
    }

    .property-actions-bottom {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .properties-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
    }

    .page-number {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .page-number.active {
      background: var(--primary);
      color: white;
    }

    .page-number:not(.active):hover {
      background: var(--accent);
    }

    @media (max-width: 768px) {
      .properties-grid {
        grid-template-columns: 1fr;
      }

      .properties-filters {
        flex-direction: column;
      }

      .properties-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class PropertiesComponent {
  properties = [
    {
      id: 1,
      title: 'Modern Downtown Apartment',
      address: '123 Main Street, Downtown',
      price: 2500,
      status: 'For Rent',
      image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      views: 145,
      inquiries: 12,
      favorites: 8,
      listedDate: '2 days ago'
    },
    {
      id: 2,
      title: 'Spacious Family House',
      address: '456 Oak Avenue, Suburbs',
      price: 450000,
      status: 'For Sale',
      image: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 4,
      bathrooms: 3,
      area: 2800,
      views: 289,
      inquiries: 25,
      favorites: 15,
      listedDate: '1 week ago'
    },
    {
      id: 3,
      title: 'Luxury Waterfront Condo',
      address: '789 Beach Road, Marina',
      price: 750000,
      status: 'For Sale',
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      views: 567,
      inquiries: 45,
      favorites: 32,
      listedDate: '3 days ago'
    },
    {
      id: 4,
      title: 'Cozy Studio Apartment',
      address: '321 College Street, Campus',
      price: 1200,
      status: 'Rented',
      image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 1,
      bathrooms: 1,
      area: 600,
      views: 78,
      inquiries: 6,
      favorites: 4,
      listedDate: '2 weeks ago'
    },
    {
      id: 5,
      title: 'Commercial Office Space',
      address: '555 Business District, Central',
      price: 5000,
      status: 'For Rent',
      image: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 0,
      bathrooms: 2,
      area: 3200,
      views: 234,
      inquiries: 18,
      favorites: 11,
      listedDate: '5 days ago'
    },
    {
      id: 6,
      title: 'Victorian Style House',
      address: '888 Heritage Lane, Historic',
      price: 380000,
      status: 'Sold',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
      bedrooms: 3,
      bathrooms: 2,
      area: 2200,
      views: 445,
      inquiries: 35,
      favorites: 28,
      listedDate: '1 month ago'
    }
  ];
}