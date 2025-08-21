import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

declare var $: any;

@Component({
  selector: 'app-featured-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-properties.component.html',
  styleUrl: './featured-properties.component.css'
})
export class FeaturedPropertiesComponent implements OnInit, AfterViewInit {
  featuredProperties: Property[] = [];
  loading: boolean = false;
  error: string | null = null;
  owners: { [userId: string]: User } = {};

  constructor(
    private propertyService: PropertyService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProperties();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if ($('.feature_property_slider').owlCarousel) {
        $('.feature_property_slider').owlCarousel({
          items: 3,
          loop: true,
          margin: 30,
          nav: true,
          dots: true,
          responsive: {
            0: { items: 1 },
            768: { items: 2 },
            992: { items: 3 }
          }
        });
      }
    }, 0);
  }

  loadFeaturedProperties(): void {
    this.loading = true;
    this.propertyService.getFeaturedProperties().subscribe({
      next: (data: Property[]) => {
        this.featuredProperties = data.sort((a: Property, b: Property) => (b.views + b.favorites) - (a.views + a.favorites)).slice(0, 6);
        this.loading = false;
        this.loadOwners();
        setTimeout(() => {
          if ($('.feature_property_slider').owlCarousel) {
            $('.feature_property_slider').trigger('destroy.owl.carousel');
            $('.feature_property_slider').owlCarousel({
              items: 3,
              loop: true,
              margin: 30,
              nav: true,
              dots: true,
              responsive: {
                0: { items: 1 },
                768: { items: 2 },
                992: { items: 3 }
              }
            });
          }
        }, 0);
      },
      error: (error: any) => {
        this.error = 'Failed to load featured properties';
        this.loading = false;
        console.error('Error fetching featured properties:', error);
      }
    });
  }

  loadOwners(): void {
    const ownerIds = Array.from(new Set(this.featuredProperties.map(p => p.owner)));
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
} 