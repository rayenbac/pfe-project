import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { PropertyService } from '../../../../core/services/property.service';
import { AgencyService } from '../../../../core/services/agency.service';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReportService } from '../../../../core/services/report.service';
import { User } from '../../../../core/models/user.model';
import { Property } from '../../../../core/models/property.model';
import { Agency } from '../../../../core/models/agency.model';
import { Review } from '../../../../core/models/review.model';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { 
  FeaturedPropertiesSidebarComponent,
  CategoriesPropertiesSidebarComponent,
  RecentlyViewedSidebarComponent
} from '../../../../shared/components';

@Component({
  selector: 'app-agent-details',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    FeaturedPropertiesSidebarComponent,
    CategoriesPropertiesSidebarComponent,
    RecentlyViewedSidebarComponent
  ],
  templateUrl: './agent-details.component.html',
  styleUrls: ['./agent-details.component.css']
})
export class AgentDetailsComponent implements OnInit {
  agent: User | null = null;
  agency: Agency | null = null;
  agentProperties: Property[] = [];
  agentReviews: Review[] = [];
  loading = true;
  error: string | null = null;
  currentUser: User | null = null;
  
  
  // Review form - simplified for authenticated users
  reviewForm = {
    rating: 5,
    comment: ''
  };

  // Statistics
  stats = {
    totalProperties: 0,
    totalSales: 0,
    averageRating: 0,
    totalReviews: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private propertyService: PropertyService,
    private agencyService: AgencyService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    
    this.route.params.subscribe(params => {
      const agentSlug = params['slug'] || params['id']; // Support both slug and ID for backward compatibility
      if (agentSlug) {
        this.loadAgentDetails(agentSlug);
      }
    });
  }

  private loadAgentDetails(agentSlug: string): void {
    this.loading = true;
    
    // Try to load by slug first, then by ID if slug fails
    this.userService.getAgentBySlug(agentSlug).subscribe({
      next: (user) => {
        if (user && user._id) {
          this.agent = user;
          this.loadAgentData(user._id);
        } else {
          this.error = 'Agent not found';
          this.loading = false;
        }
      },
      error: (error) => {
        // If slug fails, try by ID (backward compatibility)
        if (this.isValidObjectId(agentSlug)) {
          this.userService.getUser(agentSlug).subscribe({
            next: (user) => {
              if (user && user._id) {
                this.agent = user;
                this.loadAgentData(user._id);
              } else {
                this.error = 'Agent not found';
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('Error loading agent details:', error);
              this.error = 'Failed to load agent details';
              this.loading = false;
            }
          });
        } else {
          console.error('Error loading agent by slug:', error);
          this.error = 'Agent not found';
          this.loading = false;
        }
      }
    });
  }

  // Helper method to check if a string is a valid ObjectId
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  private loadAgentData(agentId: string): void {
    // Ensure we have a valid ObjectId, not a slug
    if (!agentId || agentId === 'undefined') {
      console.error('Invalid agent ID:', agentId);
      this.error = 'Invalid agent ID';
      this.loading = false;
      return;
    }

    Promise.all([
      this.loadAgentProperties(agentId),
      this.loadAgentReviews(agentId),
      this.loadAgentAgency(agentId)
    ]).then(() => {
      this.calculateStats();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading agent data:', error);
      this.loading = false;
    });
  }

  private loadAgentProperties(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!agentId || agentId === 'undefined') {
        console.warn('No valid agent ID for loading properties');
        this.agentProperties = [];
        resolve();
        return;
      }

      this.propertyService.getPropertiesByOwner(agentId).subscribe({
        next: (properties) => {
          this.agentProperties = properties;
          resolve();
        },
        error: (error) => {
          console.error('Error loading agent properties:', error);
          this.agentProperties = []; // Set empty array on error
          resolve(); // Don't reject, just continue with empty properties
        }
      });
    });
  }

  private loadAgentReviews(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!agentId || agentId === 'undefined') {
        console.warn('No valid agent ID for loading reviews');
        this.agentReviews = [];
        resolve();
        return;
      }

      this.reviewService.getAgentReviews(agentId).subscribe({
        next: (reviews) => {
          this.agentReviews = reviews;
          resolve();
        },
        error: (error) => {
          console.error('Error loading agent reviews:', error);
          // For demo purposes, create some mock reviews if service fails
          this.agentReviews = [
            {
              id: '1',
              reviewerName: 'John Smith',
              rating: 5,
              comment: 'Excellent service! Very professional and responsive.',
              entityType: 'agent',
              entityId: agentId,
              createdAt: new Date('2024-12-01')
            },
            {
              id: '2',
              reviewerName: 'Sarah Johnson',
              rating: 4,
              comment: 'Great agent, helped me find the perfect home.',
              entityType: 'agent',
              entityId: agentId,
              createdAt: new Date('2024-11-15')
            },
            {
              id: '3',
              reviewerName: 'Mike Wilson',
              rating: 5,
              comment: 'Highly recommend! Made the buying process smooth.',
              entityType: 'agent',
              entityId: agentId,
              createdAt: new Date('2024-10-20')
            }
          ];
          resolve();
        }
      });
    });
  }

  private loadAgentAgency(agentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.agent?.agencyId) {
        this.agencyService.getAgency(this.agent.agencyId).subscribe({
          next: (agency) => {
            this.agency = agency;
            resolve();
          },
          error: (error) => {
            console.error('Error loading agency:', error);
            resolve(); // Don't fail if agency can't be loaded
          }
        });
      } else {
        resolve();
      }
    });
  }

  private calculateStats(): void {
    this.stats.totalProperties = this.agentProperties.length;
    this.stats.totalReviews = this.agentReviews.length;
    
    if (this.agentReviews.length > 0) {
      this.stats.averageRating = this.reviewService.calculateAverageRating(this.agentReviews);
    }
    
    // Calculate sales (for demo purposes, assume 30% of properties are sold)
    this.stats.totalSales = Math.floor(this.agentProperties.length * 0.3);
  }

  startChatWithAgent(): void {
    if (!this.currentUser) {
      // Redirect to login if user is not authenticated
      alert('Please login to start a chat with the agent');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.agent?._id) {
      alert('Agent information not available');
      return;
    }

    // Redirect to chat page with the agent ID as a parameter
    // This will either create a new conversation or open existing one
    this.router.navigate(['/chat'], { 
      queryParams: { 
        agentId: this.agent._id,
        agentName: `${this.agent.firstName} ${this.agent.lastName}`
      }
    });
  }

  onSubmitReview(): void {
    // Check if user is logged in
    if (!this.currentUser) {
      // Redirect to login instead of showing alert
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (!this.reviewForm.comment.trim()) {
      return; // Don't submit empty reviews
    }
    
    if (!this.agent || !this.agent._id) {
      console.error('Agent information not available');
      return;
    }
    
    const newReview: Review = {
      reviewerName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
      reviewerEmail: this.currentUser.email,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment.trim(),
      userId: this.currentUser._id,
      entityType: 'agent',
      entityId: this.agent._id,
      targetType: 'agent', // Backend field
      targetId: this.agent._id, // Backend field
      createdAt: new Date()
    };
    
    // Submit review via service
    this.reviewService.addReview(newReview).subscribe({
      next: (review) => {
        // Add review to the list with the returned data
        this.agentReviews.unshift({
          ...review,
          reviewerName: newReview.reviewerName // Ensure the name is displayed
        });
        
        // Recalculate stats
        this.calculateStats();
        
        // Reset form
        this.reviewForm = {
          rating: 5,
          comment: ''
        };
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        
        // For demo purposes, add review locally if service fails
        const localReview = {
          ...newReview,
          id: Date.now().toString()
        };
        this.agentReviews.unshift(localReview);
        this.calculateStats();
        
        this.reviewForm = {
          rating: 5,
          comment: ''
        };
      }
    });
  }

  isUserLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getUserFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return '';
  }

  getPropertyCount(): number {
    return this.agentProperties.length;
  }

  getProfileImage(): string {
    if (this.agent?.profileImage) {
      let baseUrl = environment.apiBaseUrl;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      if (this.agent.profileImage.startsWith('/uploads/')) {
        return baseUrl + this.agent.profileImage;
      }
      if (this.agent.profileImage.startsWith('http')) {
        return this.agent.profileImage;
      }
    }
    return 'assets/images/property/owner.webp';
  }

  getPropertyImageUrl(property: Property): string {
    if (property.media && property.media.length > 0) {
      return 'http://localhost:3000' + property.media[0].url;
    }
    return 'assets/images/default-property.jpg';
  }

  formatPropertyPrice(property: Property): string {
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

  goToPropertyDetails(property: Property): void {
    const slug = this.createSlug(property.title);
    this.router.navigate(['/property', slug]);
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Helper method to create agent slug
  static createAgentSlug(firstName: string, lastName: string): string {
    return `${firstName}-${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPropertyTypeCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    this.agentProperties.forEach(property => {
      counts[property.type] = (counts[property.type] || 0) + 1;
    });
    return counts;
  }

  hasDescription(): boolean {
    return !!(this.agent?.description && this.agent.description.trim().length > 0);
  }

  hasProperties(): boolean {
    return this.agentProperties.length > 0;
  }

  getDescription(): string {
    return this.agent?.description || '';
  }

  reportAgent(): void {
    if (!this.currentUser) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login to report this agent',
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

    if (!this.agent) return;

    // Show report categories
    Swal.fire({
      title: 'Report Agent',
      text: 'Why are you reporting this agent?',
      input: 'select',
      inputOptions: {
        'inappropriate_content': 'Inappropriate behavior',
        'harassment': 'Harassment',
        'fraud': 'Fraud or scam',
        'fake_listing': 'Fake profile',
        'offensive_language': 'Offensive language',
        'spam': 'Spam',
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
        this.showAgentReportDetailsModal(result.value);
      }
    });
  }

  private showAgentReportDetailsModal(category: string): void {
    Swal.fire({
      title: 'Report Details',
      html: `
        <p class="mb-3">Category: <strong>${this.reportService.getReportCategoryDisplayName(category)}</strong></p>
        <textarea 
          id="reportReason" 
          class="form-control" 
          placeholder="Please provide more details about why you're reporting this agent..."
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
        this.submitAgentReport(category, result.value);
      }
    });
  }

  private submitAgentReport(category: string, reason: string): void {
    if (!this.agent) return;

    const reportData = {
      targetType: 'agent' as const,
      targetId: this.agent._id,
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
