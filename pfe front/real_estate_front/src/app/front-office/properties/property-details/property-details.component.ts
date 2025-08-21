import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyTrackingService } from '../../../core/services/property-tracking.service';
import { ReportService } from '../../../core/services/report.service';
import { Property, PropertyMedia, PropertyAmenity } from '../../../core/models/property.model';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChatButtonComponent } from '../../chat/chat-button.component';
import { SimilarPropertiesComponent } from '../similar-properties/similar-properties.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal.component';

declare var $: any;

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChatButtonComponent, SimilarPropertiesComponent, ReportModalComponent],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  property: Property | null = null;
  loading = true;
  error: string | null = null;
  currentSlide = 0;
  isFavorite = false;
  similarProperties: Property[] = [];
  isLoggedIn = false;
  
  @ViewChild('propertySlider') propertySlider!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private propertyTrackingService: PropertyTrackingService,
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getCurrentUser();
    
    this.route.params.subscribe(params => {
      const id = params['id'];
      const slug = params['slug'];
      
      if (slug) {
        // New slug-based route
        this.loadPropertyBySlug(slug);
      } else if (id) {
        // Legacy ID-based route
        this.loadProperty(id);
      }
    });
    
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.property && this.isLoggedIn) {
        this.checkIfFavorite();
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize slider after view is initialized
    setTimeout(() => {
      this.initializeSlider();
    }, 500);
  }

  private loadProperty(id: string): void {
    this.loading = true;
    this.propertyService.getProperty(id).subscribe({
      next: (property) => {
        this.property = property;
        this.loading = false;
        
        // Track property view
        if (property) {
          this.propertyTrackingService.trackPropertyView(property);
        }
        
        if (this.isLoggedIn) {
          this.checkIfFavorite();
        }
        
        this.loadSimilarProperties();
        
        // Initialize slider after data is loaded
        setTimeout(() => {
          this.initializeSlider();
        }, 500);
      },
      error: (error) => {
        this.error = 'Property not found';
        this.loading = false;
        console.error('Error loading property:', error);
      }
    });
  }

  private loadPropertyBySlug(slug: string): void {
    this.loading = true;
    this.propertyService.getPropertyBySlug(slug).subscribe({
      next: (property) => {
        this.property = property;
        this.loading = false;
        
        // Track property view
        if (property) {
          this.propertyTrackingService.trackPropertyView(property);
        }
        
        if (this.isLoggedIn) {
          this.checkIfFavorite();
        }
        
        this.loadSimilarProperties();
        
        // Initialize slider after data is loaded
        setTimeout(() => {
          this.initializeSlider();
        }, 500);
      },
      error: (error) => {
        this.error = 'Property not found';
        this.loading = false;
        console.error('Error loading property by slug:', error);
      }
    });
  }

  private loadSimilarProperties(): void {
    if (!this.property) return;
    
    const criteria = {
      type: this.property.type,
      listingType: this.property.listingType,
      excludeId: this.property._id
    };
    
    this.propertyService.searchProperties(criteria).subscribe({
      next: (properties) => {
        this.similarProperties = properties.slice(0, 3); // Limit to 3 similar properties
      },
      error: (error) => {
        console.error('Error loading similar properties:', error);
      }
    });
  }

  private checkIfFavorite(): void {
    if (!this.property || !this.isLoggedIn) return;
    
    this.favoriteService.checkFavorite(this.property._id).subscribe({
      next: (result) => {
        this.isFavorite = result.isFavorite;
      },
      error: (error) => {
        console.error('Error checking favorite status:', error);
      }
    });
  }

  getImageUrl(media: PropertyMedia): string {
    if (!media || !media.url) {
      return 'assets/images/property/default.jpg';
    }
    return 'http://localhost:3000' + media.url;
  }

  getMapUrl(): SafeResourceUrl {
    if (!this.property || !this.property.address) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    if (this.property.address.latitude && this.property.address.longitude) {
      const lat = this.property.address.latitude;
      const lng = this.property.address.longitude;
      const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
    }
    const address = encodeURIComponent(
      `${this.property.address.street}, ${this.property.address.city}, ${this.property.address.state}, ${this.property.address.country}`
    );
    const mapUrl = `https://maps.google.com/maps?q=${address}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }

  groupAmenities(): PropertyAmenity[][] {
    if (!this.property || !this.property.amenities) return [];
    
    const amenities = [...this.property.amenities];
    const groups: PropertyAmenity[][] = [];
    const itemsPerGroup = Math.ceil(amenities.length / 2);
    
    for (let i = 0; i < amenities.length; i += itemsPerGroup) {
      groups.push(amenities.slice(i, i + itemsPerGroup));
    }
    
    return groups;
  }

  initializeSlider(): void {
    if (!this.property || !this.property.media || this.property.media.length === 0) return;
    
    // Initialize the slider if jQuery is available
    if ($) {
      $('.property-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: '.property-thumbnails'
      });
      
      $('.property-thumbnails').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        asNavFor: '.property-slider',
        dots: false,
        centerMode: true,
        focusOnSelect: true
      });
    }
  }

  prevSlide(): void {
    if ($) {
      $('.property-slider').slick('slickPrev');
    } else {
      this.currentSlide = Math.max(0, this.currentSlide - 1);
    }
  }

  nextSlide(): void {
    if ($) {
      $('.property-slider').slick('slickNext');
    } else {
      const maxSlide = this.property?.media?.length ? this.property.media.length - 1 : 0;
      this.currentSlide = Math.min(maxSlide, this.currentSlide + 1);
    }
  }

  goToSlide(index: number): void {
    if ($) {
      $('.property-slider').slick('slickGoTo', index);
    } else {
      this.currentSlide = index;
    }
  }

  addToFavorites(): void {
    if (!this.isLoggedIn) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to be logged in to add properties to favorites',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Store current URL to redirect back after login
          localStorage.setItem('redirectAfterLogin', this.router.url);
          this.router.navigate(['/login']);
        }
      });
      return;
    }
    
    if (!this.property) return;
    
    if (this.isFavorite) {
      this.favoriteService.removeFromFavorites(this.property._id).subscribe({
        next: () => {
          this.isFavorite = false;
          Swal.fire({
            title: 'Removed!',
            text: 'Property removed from favorites',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error removing from favorites:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to remove from favorites',
            icon: 'error'
          });
        }
      });
    } else {
      this.favoriteService.addToFavorites(this.property._id).subscribe({
        next: () => {
          this.isFavorite = true;
          Swal.fire({
            title: 'Added!',
            text: 'Property added to favorites',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error adding to favorites:', error);
          Swal.fire({
            title: 'Error',
            text: 'Failed to add to favorites',
            icon: 'error'
          });
        }
      });
    }
  }

  shareProperty(): void {
    $('#shareModal').modal('show');
  }

  printProperty(): void {
    window.print();
  }

  getShareLink(): string {
    return window.location.href;
  }

  copyShareLink(): void {
    const linkInput = document.getElementById('shareLink') as HTMLInputElement;
    linkInput.select();
    document.execCommand('copy');
    
    Swal.fire({
      title: 'Copied!',
      text: 'Link copied to clipboard',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  shareOnFacebook(): void {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.property?.title || 'Property Listing');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank');
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this property: ${this.property?.title || 'Property Listing'}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  }

  shareOnWhatsapp(): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this property: ${this.property?.title || 'Property Listing'}`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }

  shareByEmail(): void {
    const subject = encodeURIComponent(`Property Listing: ${this.property?.title || 'Property'}`);
    const body = encodeURIComponent(`Check out this property: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  reportProperty(): void {
    if (!this.isLoggedIn) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login to report this property',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login']);
        }
      });
      return;
    }

    if (!this.property) return;

    // Show report categories
    Swal.fire({
      title: 'Report Property',
      text: 'Why are you reporting this property?',
      input: 'select',
      inputOptions: {
        'spam': 'Spam or fake listing',
        'inappropriate_content': 'Inappropriate content',
        'fake_listing': 'Fake or misleading listing',
        'fraud': 'Fraud or scam',
        'offensive_language': 'Offensive language',
        'harassment': 'Harassment',
        'copyright_violation': 'Copyright violation',
        'other': 'Other'
      },
      inputPlaceholder: 'Select a reason',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a reason';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.showReportDetailsModal(result.value);
      }
    });
  }

  private showReportDetailsModal(category: string): void {
    Swal.fire({
      title: 'Report Details',
      html: `
        <p class="mb-3">Category: <strong>${this.reportService.getReportCategoryDisplayName(category)}</strong></p>
        <textarea 
          id="reportReason" 
          class="form-control" 
          placeholder="Please provide more details about why you're reporting this property..."
          rows="4"
          maxlength="500"></textarea>
        <small class="text-muted mt-2 d-block">Maximum 500 characters</small>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const reason = (document.getElementById('reportReason') as HTMLTextAreaElement).value;
        if (!reason.trim()) {
          Swal.showValidationMessage('Please provide a reason for reporting');
          return false;
        }
        if (reason.length > 500) {
          Swal.showValidationMessage('Reason must be less than 500 characters');
          return false;
        }
        return reason;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitReport(category, result.value);
      }
    });
  }

  private submitReport(category: string, reason: string): void {
    if (!this.property) return;

    const reportData = {
      targetType: 'property' as const,
      targetId: this.property._id,
      category: category,
      reason: reason.trim()
    };

    this.reportService.createReport(reportData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: 'Report Submitted',
            text: 'Thank you for your report. Our team will review it shortly.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        }
      },
      error: (error) => {
        console.error('Error submitting report:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to submit report. Please try again.',
          icon: 'error'
        });
      }
    });
  }
}