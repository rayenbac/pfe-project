import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PropertyTrackingService, ViewedProperty } from '../../../../core/services/property-tracking.service';
import { PropertyService } from '../../../../core/services/property.service';
import { Property } from '../../../../core/models/property.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-recently-viewed-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recently-viewed-sidebar.component.html',
  styleUrls: ['./recently-viewed-sidebar.component.css']
})
export class RecentlyViewedSidebarComponent implements OnInit {
  recentlyViewedProperties: ViewedProperty[] = [];
  detailedProperties: Property[] = [];
  loading = false;
  error: string | null = null;
  baseUrl: string;

  constructor(
    private propertyTrackingService: PropertyTrackingService,
    private propertyService: PropertyService,
    private router: Router
  ) {
    this.baseUrl = environment.apiBaseUrl;
    if (this.baseUrl.endsWith('/api')) {
      this.baseUrl = this.baseUrl.slice(0, -4);
    }
  }

  ngOnInit(): void {
    this.loadRecentlyViewedProperties();
  }

  loadRecentlyViewedProperties(): void {
    this.loading = true;
    this.error = null;

    try {
      // Get recently viewed properties from tracking service
      this.recentlyViewedProperties = this.propertyTrackingService.getViewedProperties();
      
      console.log('Recently viewed properties:', this.recentlyViewedProperties); // Debug log
      
      if (this.recentlyViewedProperties.length > 0) {
        // Load detailed property information for the first few recently viewed properties
        this.loadDetailedProperties();
      } else {
        console.log('No recently viewed properties found');
        this.loading = false;
      }
    } catch (error) {
      console.error('Error loading recently viewed properties:', error);
      this.error = 'Failed to load recently viewed properties';
      this.loading = false;
    }
  }

  private loadDetailedProperties(): void {
    const propertyIds = this.recentlyViewedProperties.slice(0, 3).map(p => p.id);
    console.log('Loading detailed properties for IDs:', propertyIds); // Debug log
    
    const promises = propertyIds.map(id => 
      this.propertyService.getProperty(id).toPromise().catch((error) => {
        console.error(`Error loading property ${id}:`, error);
        return null;
      })
    );

    Promise.all(promises).then(results => {
      this.detailedProperties = results.filter(property => property !== null) as Property[];
      console.log('Loaded detailed properties:', this.detailedProperties); // Debug log
      this.loading = false;
    }).catch(error => {
      console.error('Error loading detailed properties:', error);
      this.loading = false;
    });
  }

  getPropertyImageUrl(property: Property): string {
    if (property.images && property.images.length > 0) {
      const firstImage = property.images[0];
      
      if (firstImage.startsWith('http')) {
        return firstImage;
      }
      
      if (firstImage.startsWith('/uploads/')) {
        return this.baseUrl + firstImage;
      }
      
      return `${this.baseUrl}/uploads/properties/${firstImage}`;
    }
    
    // Check if property has media array (alternative structure)
    if (property.media && property.media.length > 0) {
      const firstMedia = property.media[0];
      if (firstMedia.url) {
        if (firstMedia.url.startsWith('http')) {
          return firstMedia.url;
        }
        if (firstMedia.url.startsWith('/uploads/')) {
          return this.baseUrl + firstMedia.url;
        }
        return `${this.baseUrl}${firstMedia.url}`;
      }
    }
    
    return 'assets/images/blog/default-property.jpg';
  }

  formatPrice(price: number | undefined): string {
    if (!price || isNaN(price)) {
      return 'N/A';
    }
    
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(0) + 'K';
    }
    return price.toString();
  }

  goToPropertyDetails(property: Property): void {
    this.router.navigate(['/properties', property._id]);
  }

  // Fallback to use ViewedProperty data if detailed properties not available
  getRecentlyViewedForDisplay(): any[] {
    if (this.detailedProperties.length > 0) {
      return this.detailedProperties.slice(0, 3);
    }
    
    // Use ViewedProperty data as fallback
    return this.recentlyViewedProperties.slice(0, 3).map(viewed => ({
      _id: viewed.id,
      title: `${viewed.type} in ${viewed.location}`,
      price: viewed.price,
      bedrooms: viewed.bedrooms,
      bathrooms: viewed.bathrooms,
      type: viewed.type,
      listingType: 'sale', // Default fallback
      images: [], // No images available in ViewedProperty
      area: 0 // No area available in ViewedProperty
    }));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/blog/default-property.jpg';
    }
  }
}
