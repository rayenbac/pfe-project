import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Property } from '../../../../core/models/property.model';
import { PropertyService } from '../../../../core/services/property.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-featured-properties-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-properties-sidebar.component.html',
  styleUrls: ['./featured-properties-sidebar.component.css']
})
export class FeaturedPropertiesSidebarComponent implements OnInit {
  featuredProperties: Property[] = [];
  loading = false;
  error: string | null = null;
  baseUrl: string;

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {
    this.baseUrl = environment.apiBaseUrl;
    if (this.baseUrl.endsWith('/api')) {
      this.baseUrl = this.baseUrl.slice(0, -4);
    }
  }

  ngOnInit(): void {
    this.loadFeaturedProperties();
  }

  loadFeaturedProperties(): void {
    this.loading = true;
    this.error = null;

    this.propertyService.getFeaturedProperties().subscribe({
      next: (properties) => {
        console.log('Featured properties loaded:', properties); // Debug log
        this.featuredProperties = properties.slice(0, 5); // Get top 5 featured properties
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading featured properties:', error);
        this.error = 'Failed to load featured properties';
        this.loading = false;
      }
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
    
    return 'assets/images/property/default-property.jpg';
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/property/default-property.jpg';
    }
  }
}
