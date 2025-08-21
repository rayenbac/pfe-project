import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RecommenderService, Recommendation, TrendingProperty } from '../../../core/services/recommender.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyTrackingService } from '../../../core/services/property-tracking.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { User } from '../../../core/models/user.model';
import { Property } from '../../../core/models/property.model';
import { environment } from '../../../../environments/environment';

declare var $: any;

@Component({
  selector: 'app-homepage-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './homepage-recommendations.component.html',
  styleUrls: ['./homepage-recommendations.component.css']
})
export class HomepageRecommendationsComponent implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  personalizedRecommendations: Recommendation[] = [];
  trendingProperties: TrendingProperty[] = [];
  isLoading = true;
  error: string | null = null;
  environment = environment;
  
  // New properties for guest recommendation logic
  isGuestUser = false;
  hasGuestHistory = false;
  showPersonalizedSection = false;

  constructor(
    private recommenderService: RecommenderService,
    private authService: AuthService,
    private propertyService: PropertyService,
    private trackingService: PropertyTrackingService,
    private consentService: CookieConsentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isGuestUser = !this.currentUser;
    
    if (this.currentUser) {
      this.showPersonalizedSection = true;
      this.loadRecommendations();
    } else {
      // Initialize geolocation for guest users
      this.initializeGuestTracking();
      this.checkGuestHistoryAndLoad();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSlider();
    }, 0);
  }

  initializeSlider(): void {
    if ($('.homepage_recommendations_slider').length) {
      $('.homepage_recommendations_slider').trigger('destroy.owl.carousel');
      $('.homepage_recommendations_slider').owlCarousel({
        loop: true,
        margin: 30,
        dots: true,
        nav: true,
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
          1366: { items: 3 },
          1400: { items: 3 }
        }
      });
    }
  }

  trackByPropertyId(index: number, recommendation: Recommendation): string {
    return recommendation.property_id;
  }

  trackByTrendingId(index: number, trending: TrendingProperty): string {
    return trending.property_id;
  }

  private loadRecommendations(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.error = null;

    // Load personalized recommendations
    this.recommenderService.getRecommendationsWithDetails(this.currentUser._id, 'hybrid', 6)
      .subscribe({
        next: (response) => {
          this.personalizedRecommendations = response.recommendations;
          this.loadTrendingProperties();
          // Initialize slider after data is loaded
          setTimeout(() => {
            this.initializeSlider();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading personalized recommendations:', error);
          this.error = 'Failed to load personalized recommendations';
          this.loadTrendingProperties(); // Still try to load trending
        }
      });
  }

  private loadTrendingProperties(): void {
    this.recommenderService.getTrendingProperties(6)
      .subscribe({
        next: (response) => {
          this.trendingProperties = response.trending_properties;
          this.isLoading = false;
          // Initialize slider after data is loaded
          setTimeout(() => {
            this.initializeSlider();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading trending properties:', error);
          this.error = 'Failed to load trending properties';
          this.isLoading = false;
        }
      });
  }

  getPropertyImageUrl(property: Property | undefined): string {
    if (!property) return '/assets/images/property-placeholder.jpg';
    
    if (property.media && property.media.length > 0) {
      const primaryImage = property.media.find(m => m.isPrimary) || property.media[0];
      return `${this.environment.apiBaseUrl}/${primaryImage.url}`;
    }
    
    return '/assets/images/property-placeholder.jpg';
  }

  // Method to match featured properties component for media handling
  getImageUrl(media: any[] | undefined): string {
    if (media && media.length > 0) {
      // Match the featured properties format exactly
      return 'http://localhost:3000' + media[0].url;
    }
    // Use a more specific fallback that matches your assets
    return 'assets/images/property-placeholder.jpg';
  }

  formatPrice(price: number): string {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price}`;
    }
  }

  getPropertyUrl(property: Property | undefined): string {
    if (!property) return '#';
    
    return `/properties/${property._id}`;
  }

  onPropertyClick(propertyId: string): void {
    if (this.currentUser) {
      // Track user interaction for logged in users
      this.recommenderService.trackUserInteraction(
        this.currentUser._id,
        propertyId,
        'view'
      ).subscribe({
        next: () => console.log('Interaction tracked'),
        error: (error) => console.error('Error tracking interaction:', error)
      });
    } else {
      // Track property view for guest users using cookies
      const property = this.findPropertyById(propertyId);
      if (property) {
        this.trackingService.trackPropertyView(property);
        
        // Check if this is the first property view for guest
        if (!this.hasGuestHistory) {
          this.hasGuestHistory = true;
          // Reload recommendations to show personalized section
          setTimeout(() => {
            this.checkGuestHistoryAndLoad();
          }, 500); // Small delay to ensure cookie is set
        }
      }
    }
  }

  private initializeGuestTracking(): void {
    // Request geolocation permission for better recommendations
    if (this.consentService.canUsePreferencesCookies()) {
      this.trackingService.requestGeolocation().then(location => {
        if (location) {
          console.log('Location captured for guest recommendations:', location);
        }
      });
    }
  }

  private loadGuestRecommendations(): void {
    this.isLoading = true;
    this.error = null;

    // Check if we have viewing history and preferences
    const preferences = this.trackingService.getPropertyPreferences();
    const viewedProperties = this.trackingService.getViewedProperties();
    const userLocation = this.trackingService.getUserLocation();

    if (preferences || viewedProperties.length > 0 || userLocation) {
      // Load smart recommendations based on cookies
      this.recommenderService.getGuestRecommendations({
        preferences,
        viewedProperties,
        userLocation,
        limit: 6
      }).subscribe({
        next: (response) => {
          this.personalizedRecommendations = response.recommendations;
          // Only show personalized section if we actually have recommendations
          this.showPersonalizedSection = response.recommendations.length > 0;
          this.loadTrendingProperties();
          // Initialize slider after data is loaded
          setTimeout(() => {
            this.initializeSlider();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading guest recommendations:', error);
          this.personalizedRecommendations = [];
          this.showPersonalizedSection = false; // Hide section on error
          this.loadTrendingProperties();
        }
      });
    } else {
      // No tracking data available - hide the entire section for new guest users
      this.personalizedRecommendations = [];
      this.trendingProperties = [];
      this.showPersonalizedSection = false;
      this.isLoading = false; // Stop loading since we're hiding the section
    }
  }

  private checkGuestHistoryAndLoad(): void {
    // Check if guest user has any tracking data
    const preferences = this.trackingService.getPropertyPreferences();
    const viewedProperties = this.trackingService.getViewedProperties();
    const userLocation = this.trackingService.getUserLocation();
    
    this.hasGuestHistory = !!(preferences || viewedProperties.length > 0 || userLocation);
    
    this.loadGuestRecommendations();
  }

  private findPropertyById(propertyId: string): Property | undefined {
    // Find property in current recommendations
    const fromPersonalized = this.personalizedRecommendations.find(r => r.property_id === propertyId)?.property;
    if (fromPersonalized) return fromPersonalized;

    const fromTrending = this.trendingProperties.find(t => t.property_id === propertyId)?.property;
    return fromTrending;
  }

  getRecommendationReason(recommendation: Recommendation): string {
    if (recommendation.score > 0.8) {
      return 'Highly recommended for you';
    } else if (recommendation.score > 0.6) {
      return 'Good match based on your preferences';
    } else {
      return 'You might like this';
    }
  }

  getOwnerImage(owner: any): string {
    if (owner?.profileImage) {
      return `${this.environment.apiBaseUrl}/${owner.profileImage}`;
    }
    return '/assets/images/team/lc1.png';
  }

  getOwnerName(owner: any): string {
    if (owner?.firstName && owner?.lastName) {
      return `${owner.firstName} ${owner.lastName}`;
    } else if (owner?.firstName) {
      return owner.firstName;
    }
    return 'Real Estate Agent'; // Better fallback than 'Agent Name'
  }

  goToPropertyDetails(property: Property): void {
    // Track the click first
    this.onPropertyClick(property._id);
    
    // Then navigate to property details
    const slug = PropertyService.createSlug(property.title);
    this.router.navigate(['/property', slug]);
  }
}