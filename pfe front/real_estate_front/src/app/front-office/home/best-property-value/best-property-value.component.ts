import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

declare var $: any;

@Component({
  selector: 'app-best-property-value',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './best-property-value.component.html',
  styleUrl: './best-property-value.component.css'
})
export class BestPropertyValueComponent implements OnInit, AfterViewInit {
  bestValueProperties: Property[] = [];
  loading: boolean = false;
  error: string | null = null;
  owners: { [userId: string]: User } = {};

  constructor(
    private propertyService: PropertyService,
    private userService: UserService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.loadBestValueProperties();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlider();
    }, 0);
  }

  loadBestValueProperties(): void {
    this.loading = true;
    this.propertyService.getProperties().subscribe({
      next: (data: Property[]) => {
        // Calculate best value score for each property and sort
        const scoredProperties = data.map(property => ({
          ...property,
          valueScore: this.calculateValueScore(property)
        })).sort((a, b) => b.valueScore - a.valueScore);

        // Take top 6 best value properties
        this.bestValueProperties = scoredProperties.slice(0, 6);
        this.loading = false;
        this.loadOwners();
        
        // Reinitialize slider after data loads
        setTimeout(() => {
          this.initializeSlider();
        }, 0);
      },
      error: (error: any) => {
        this.error = 'Failed to load best value properties';
        this.loading = false;
        console.error('Error fetching best value properties:', error);
      }
    });
  }

  calculateValueScore(property: Property): number {
    let score = 0;

    // Verified → +10 points
    if (property.verified) {
      score += 10;
    }

    // Featured → +8 points
    if (property.featured) {
      score += 8;
    }

    // Views × 0.01
    score += property.views * 0.01;

    // Favorites × 0.5
    score += property.favorites * 0.5;

    // Virtual Tour available → +3 points
    if (property.virtualTour && property.virtualTour.url) {
      score += 3;
    }

    // Each amenity → +0.5 points
    if (property.amenities && property.amenities.length > 0) {
      score += property.amenities.length * 0.5;
    }

    // Price per m² scoring
    if (property.pricing && property.size) {
      const pricePerSqm = this.calculatePricePerSqm(property);
      if (pricePerSqm <= 2000) {
        score += 10;
      } else if (pricePerSqm <= 2500) {
        score += 5;
      }
      // Otherwise → 0 (no additional points)
    }

    return score;
  }

  calculatePricePerSqm(property: Property): number {
    if (!property.pricing || !property.size) return 0;
    
    const totalSize = property.size.total;
    const price = property.pricing.price;
    
    if (totalSize === 0) return 0;
    
    // Convert to price per square meter if needed
    if (property.size.unit === 'sqft') {
      // Convert sqft to sqm (1 sqft = 0.092903 sqm)
      const sizeInSqm = totalSize * 0.092903;
      return price / sizeInSqm;
    } else {
      // Already in sqm
      return price / totalSize;
    }
  }

  loadOwners(): void {
    const ownerIds = Array.from(new Set(this.bestValueProperties.map(p => p.owner)));
    ownerIds.forEach(ownerId => {
      if (!this.owners[ownerId]) {
        this.userService.getUser(ownerId).subscribe({
          next: (user: User) => {
            this.owners[ownerId] = user;
          },
          error: () => {
            // fallback: do nothing, will use default image and 'Unknown'
          }
        });
      }
    });
  }

  initializeSlider(): void {
    if ($('.best_property_slider').length) {
      $('.best_property_slider').trigger('destroy.owl.carousel');
      $('.best_property_slider').owlCarousel({
        loop: true,
        margin: 30,
        dots: true,
        nav: false,
        rtl: false,
        autoplayHoverPause: false,
        autoplay: false,
        singleItem: true,
        smartSpeed: 1200,
        navText: [
          '<i class="flaticon-left-arrow"></i>',
          '<i class="flaticon-right-arrow"></i>'
        ],
        responsive: {
          0: { items: 1, center: false },
          480: { items: 1, center: false },
          520: { items: 1, center: false },
          600: { items: 2, center: false },
          768: { items: 2 },
          992: { items: 3 },
          1200: { items: 3 },
          1366: { items: 4 },
          1400: { items: 4 }
        }
      });
    }
  }

  getImageUrl(media: any[]): string {
    if (media && media.length > 0) {
      return 'http://localhost:3000' + media[0].url;
    }
    return 'assets/images/default-property.jpg';
  }

  getOwnerName(ownerId: string): string {
    const owner = this.owners[ownerId];
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown';
  }

  getOwnerImage(ownerId: string): string {
    const owner = this.owners[ownerId];
    return owner && owner.profileImage ? 'http://localhost:3000' + owner.profileImage : 'assets/images/property/owner.webp';
  }

  goToPropertyDetails(property: Property): void {
    const slug = PropertyService.createSlug(property.title);
    this.router.navigate(['/property', slug]);
  }

  goToAllProperties(): void {
    this.router.navigate(['/properties']);
  }

  formatPrice(property: Property): string {
    if (!property.pricing) return 'Price on request';
    
    const price = property.pricing.price;
    const listingType = property.listingType;
    
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M${listingType === 'rent' ? '/mo' : ''}`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K${listingType === 'rent' ? '/mo' : ''}`;
    } else {
      return `$${price}${listingType === 'rent' ? '/mo' : ''}`;
    }
  }

  getTimeSinceCreated(createdAt: Date): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }
}
