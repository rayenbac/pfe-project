import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { RecommenderService, SimilarProperty } from '../../../core/services/recommender.service';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property } from '../../../core/models/property.model';
import { User } from '../../../core/models/user.model';
import { environment } from '../../../../environments/environment';

declare var $: any;

@Component({
  selector: 'app-similar-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './similar-properties.component.html',
  styleUrls: ['./similar-properties.component.css']
})
export class SimilarPropertiesComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() currentProperty!: Property;
  @Input() currentPropertyId!: string;
  @Input() currentPropertyType!: string;
  @Input() currentPropertyLocation!: string;
  @Input() currentPropertyBedrooms!: number;
  @Input() currentPropertyBathrooms!: number;
  @Input() currentPropertyPrice!: number;
  @Input() propertyId!: string;
  
  similarProperties: SimilarProperty[] = [];
  isLoading = true;
  error: string | null = null;
  currentUser: User | null = null;
  environment = environment;

  constructor(
    private recommenderService: RecommenderService,
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadSimilarProperties();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['currentPropertyId'] || changes['propertyId']) && 
        (this.currentPropertyId || this.propertyId)) {
      this.loadSimilarProperties();
    }
  }

  ngAfterViewInit(): void {
    this.initializeSlider();
  }

  initializeSlider(): void {
    setTimeout(() => {
      console.log('🎠 [SIMILAR PROPERTIES] Initializing slider...');
      
      if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
        const slider = $('.similar_property_slider');
        
        if (slider.length > 0) {
          console.log('✅ [SIMILAR PROPERTIES] Slider element found, initializing...');
          
          // Destroy existing slider if it exists
          slider.trigger('destroy.owl.carousel');
          slider.removeClass('owl-drag owl-grab');
          
          // Initialize new slider with horizontal layout
          slider.owlCarousel({
            items: 3,
            loop: false,
            margin: 20,
            nav: true,
            dots: true,
            autoplay: false,
            autoHeight: false,
            mouseDrag: true,
            touchDrag: true,
            pullDrag: true,
            freeDrag: false,
            stagePadding: 0,
            responsive: {
              0: { 
                items: 1,
                margin: 10
              },
              576: { 
                items: 2,
                margin: 15
              },
              992: { 
                items: 3,
                margin: 20
              }
            }
          });
          
          console.log('🎠 [SIMILAR PROPERTIES] Slider initialized successfully');
        } else {
          console.warn('⚠️ [SIMILAR PROPERTIES] Slider element not found');
        }
      } else {
        console.warn('⚠️ [SIMILAR PROPERTIES] OwlCarousel not available');
      }
    }, 200);
  }

  loadSimilarProperties(): void {
    const propertyId = this.currentPropertyId || this.propertyId;
    if (!propertyId) {
      console.log('⚠️ [SIMILAR PROPERTIES] No property ID provided');
      return;
    }

    console.log(`🔍 [SIMILAR PROPERTIES] Loading similar properties for ID: ${propertyId}`);
    this.isLoading = true;
    this.error = null;

    // Try the advanced recommender service first
    console.log('🎯 [SIMILAR PROPERTIES] Trying recommender service first...');
    this.recommenderService.getSimilarPropertiesWithDetails(propertyId, 5)
      .subscribe({
        next: (response) => {
          console.log('✅ [SIMILAR PROPERTIES] Recommender service response:', response);
          
          // Check if we got meaningful results from the recommender service
          if (response.similar_properties && response.similar_properties.length > 0) {
            this.similarProperties = response.similar_properties;
            this.isLoading = false;
            // Reinitialize slider after data loads
            setTimeout(() => this.initializeSlider(), 100);
          } else {
            console.log('⚠️ [SIMILAR PROPERTIES] Recommender service returned empty results, falling back to property service');
            this.fallbackToPropertyService(propertyId);
          }
        },
        error: (error) => {
          console.warn('⚠️ [SIMILAR PROPERTIES] Recommender service failed, trying simple approach:', error);
          this.fallbackToPropertyService(propertyId);
        }
      });
  }

  private fallbackToPropertyService(propertyId: string): void {
    console.log('🔄 [SIMILAR PROPERTIES] Falling back to property service...');
    this.propertyService.getSimilarProperties(propertyId, 5)
      .subscribe({
        next: (response) => {
          console.log('✅ [SIMILAR PROPERTIES] Property service response:', response);
          // Convert simple Property[] to SimilarProperty[] format
          this.similarProperties = response.similarProperties.map(property => ({
            property_id: property._id,
            similarity_score: 0.7, // Default score since we don't have actual scoring
            type: property.type,
            price: property.pricing?.price || 0,
            location: property.address?.city || '',
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            property: property
          }));
          console.log(`📊 [SIMILAR PROPERTIES] Converted to ${this.similarProperties.length} similar properties`);
          this.isLoading = false;
          // Reinitialize slider after data loads
          setTimeout(() => this.initializeSlider(), 100);
        },
        error: (fallbackError) => {
          console.error('❌ [SIMILAR PROPERTIES] Both similar properties approaches failed:', fallbackError);
          this.error = 'Failed to load similar properties';
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

  getPropertyRouterLink(similarProperty: SimilarProperty): string[] {
    if (similarProperty.property) {
      const slug = PropertyService.createSlug(similarProperty.property.title);
      return [`/${slug}`];
    }
    // Fallback for properties without full data
    const slug = PropertyService.createSlug(`property-${similarProperty.property_id}`);
    return [`/${slug}`];
  }

  onPropertyClick(propertyId: string): void {
    if (this.currentUser) {
      // Track user interaction
      this.recommenderService.trackUserInteraction(
        this.currentUser._id,
        propertyId,
        'view'
      ).subscribe({
        next: () => console.log('Interaction tracked'),
        error: (error) => console.error('Error tracking interaction:', error)
      });
    }

    // Find the property and navigate using slug-based routing
    const clickedProperty = this.similarProperties.find(sp => sp.property_id === propertyId);
    if (clickedProperty) {
      const routerLink = this.getPropertyRouterLink(clickedProperty);
      this.router.navigate(routerLink);
    }
  }

  getSimilarityReason(similarProperty: SimilarProperty): string {
    const score = similarProperty.similarity_score;
    
    if (score > 0.8) {
      return 'Very similar property';
    } else if (score > 0.6) {
      return 'Similar features';
    } else if (score > 0.4) {
      return 'Related property';
    } else {
      return 'You might also like';
    }
  }

  trackBySimilarPropertyId(index: number, similarProperty: SimilarProperty): string {
    return similarProperty.property_id;
  }
}
