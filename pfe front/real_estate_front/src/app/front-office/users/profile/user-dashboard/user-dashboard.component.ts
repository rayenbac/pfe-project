import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProfileSettingsComponent } from '../profile-settings/profile-settings.component';
import { PropertyManagerComponent } from '../property-manager/property-manager.component';
import { FavoritesGridComponent } from '../favorites-grid/favorites-grid.component';
import { BookingCalendarComponent } from '../booking-calendar/booking-calendar.component';
import { ReviewsListComponent } from '../reviews-list/reviews-list.component';
import { ContractsTableComponent } from '../contracts-table/contracts-table.component';
import { InvoicesTableComponent } from '../invoices-table/invoices-table.component';
import { NotificationsPageComponent } from '../../../../shared/components/notifications-page/notifications-page.component';
import { NotificationDropdownComponent } from '../../../../shared/components/notification-dropdown/notification-dropdown.component';
import { UserService } from '../../../../core/services/user.service';
import { BookingService } from '../../../../core/services/booking.service';
import { PropertyService } from '../../../../core/services/property.service';
import { ReviewService } from '../../../../core/services/review.service';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { User } from '../../../../core/models/user.model';

interface Activity {
  icon: string;
  title: string;
  time: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ProfileSettingsComponent,
    PropertyManagerComponent,
    FavoritesGridComponent,
    BookingCalendarComponent,
    ReviewsListComponent,
    ContractsTableComponent,
    InvoicesTableComponent,
    NotificationsPageComponent,
    NotificationDropdownComponent
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() activeTab = 'overview';
  @Output() tabChanged = new EventEmitter<string>();
  
  user: User | null = null;
  loading = true;

  // Dashboard statistics
  stats = {
    properties: 0,
    bookings: 0,
    contracts: 0,
    rating: 0,
    favorites: 0,
    invoices: 0
  };

  // Recent activities
  recentActivities: Activity[] = [];

  dashboardTabs = [
    // Common tabs for both roles
    { id: 'overview', label: 'Overview', icon: 'fas fa-tachometer-alt', roles: ['USER', 'AGENT'] },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell', roles: ['USER', 'AGENT'] },
    { id: 'reservations', label: 'Reservations', icon: 'fas fa-calendar-alt', roles: ['USER', 'AGENT'] },
    { id: 'contracts', label: 'Contracts', icon: 'fas fa-file-contract', roles: ['USER', 'AGENT'] },
    { id: 'reviews', label: 'Reviews', icon: 'fas fa-star', roles: ['USER', 'AGENT'] },
    { id: 'profile', label: 'Profile Settings', icon: 'fas fa-user-cog', roles: ['USER', 'AGENT'] },
    
    // Agent-specific tabs
    { id: 'properties', label: 'My Properties', icon: 'fas fa-building', roles: ['AGENT'] },
    
    // User-specific tabs
    { id: 'favorites', label: 'Favorites', icon: 'fas fa-heart', roles: ['USER'] },
    { id: 'invoices', label: 'Invoices', icon: 'fas fa-file-invoice', roles: ['USER'] }
  ];

  constructor(
    private userService: UserService,
    private router: Router,
    private bookingService: BookingService,
    private propertyService: PropertyService,
    private reviewService: ReviewService,
    private favoriteService: FavoriteService
  ) {}

  ngOnInit(): void {
    // Initialize stats to 0
    this.stats = { properties: 0, bookings: 0, contracts: 0, rating: 0, favorites: 0, invoices: 0 };
    
    if (this.currentUser) {
      this.user = this.currentUser;
      this.loading = false;
      this.loadDashboardData();
    } else {
      this.loadUserProfile();
    }
  }

  loadUserProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.user = user;
        this.loading = false;
        this.loadDashboardData();
      },
      error: (error: any) => {
        console.error('Failed to load user profile:', error);
        this.loading = false;
      }
    });
  }

  loadDashboardData(): void {
    if (!this.user?._id) return;

    const userId = this.user._id;
    const isAgent = this.user.role.toLowerCase() === 'agent';

    if (isAgent) {
      // Load agent-specific data
      this.loadAgentData(userId);
    } else {
      // Load user-specific data
      this.loadUserData(userId);
    }
  }

  loadAgentData(userId: string): void {
    forkJoin({
      properties: this.propertyService.getAgentProperties(),
      bookings: this.bookingService.getAgentBookings(userId),
      reviews: this.reviewService.getAgentReviews(userId)
    }).subscribe({
      next: (data) => {
        console.log('Agent data loaded:', data); // Debug log
        this.stats.properties = data.properties?.length || 0;
        this.stats.bookings = data.bookings?.filter(b => b.status === 'confirmed' || b.status === 'pending').length || 0;
        this.stats.contracts = data.bookings?.filter(b => b.status === 'confirmed').length || 0;
        this.stats.rating = this.calculateAverageRating(data.reviews || []);
        
        // Generate recent activities for agent
        this.recentActivities = this.generateAgentActivities(data.properties || [], data.bookings || []);
      },
      error: (error) => {
        console.error('Error loading agent data:', error);
        // Ensure stats are reset to 0 on error
        this.stats = { properties: 0, bookings: 0, contracts: 0, rating: 0, favorites: 0, invoices: 0 };
        this.recentActivities = [];
      }
    });
  }

  loadUserData(userId: string): void {
    forkJoin({
      favorites: this.favoriteService.getUserFavorites(),
      bookings: this.bookingService.getUserReservations(userId),
      reviews: this.reviewService.getUserReviews()
    }).subscribe({
      next: (data) => {
        console.log('User data loaded:', data); // Debug log
        this.stats.favorites = data.favorites?.length || 0;
        this.stats.bookings = data.bookings?.length || 0;
        this.stats.contracts = data.bookings?.filter(b => b.status === 'confirmed').length || 0;
        this.stats.invoices = 0; // Would need invoice service
        
        // Generate recent activities for user
        this.recentActivities = this.generateUserActivities(data.favorites || [], data.bookings || []);
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Ensure stats are reset to 0 on error
        this.stats = { properties: 0, bookings: 0, contracts: 0, rating: 0, favorites: 0, invoices: 0 };
        this.recentActivities = [];
      }
    });
  }

  calculateAverageRating(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return Math.round((totalRating / reviews.length) * 10) / 10;
  }

  generateAgentActivities(properties: any[], bookings: any[]): Activity[] {
    const activities: Activity[] = [];
    
    // Recent property additions
    const recentProperties = properties
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentProperties.forEach(property => {
      activities.push({
        icon: 'fas fa-plus text-success',
        title: `New property listing: ${property.title}`,
        time: this.getTimeAgo(property.createdAt)
      });
    });
    
    // Recent bookings
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentBookings.forEach(booking => {
      activities.push({
        icon: 'fas fa-handshake text-primary',
        title: `New booking received for ${booking.property?.title || 'property'}`,
        time: this.getTimeAgo(booking.createdAt)
      });
    });
    
    return activities.slice(0, 4); // Limit to 4 activities
  }

  generateUserActivities(favorites: any[], bookings: any[]): Activity[] {
    const activities: Activity[] = [];
    
    // Recent favorites
    const recentFavorites = favorites
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentFavorites.forEach(favorite => {
      activities.push({
        icon: 'fas fa-heart text-danger',
        title: `Added ${favorite.property?.title || 'property'} to favorites`,
        time: this.getTimeAgo(favorite.createdAt)
      });
    });
    
    // Recent bookings
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentBookings.forEach(booking => {
      activities.push({
        icon: 'fas fa-calendar-check text-success',
        title: `Booking ${booking.status} for ${booking.property?.title || 'property'}`,
        time: this.getTimeAgo(booking.createdAt)
      });
    });
    
    return activities.slice(0, 4); // Limit to 4 activities
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.tabChanged.emit(tabId);
  }

  getVisibleTabs(): any[] {
    if (!this.user) return [];
    // Convert user role to uppercase for comparison
    const userRole = this.user.role.toUpperCase();
    return this.dashboardTabs.filter(tab => tab.roles.includes(userRole));
  }

  isTabVisible(tabId: string): boolean {
    if (!this.user) return false;
    const tab = this.dashboardTabs.find(t => t.id === tabId);
    if (!tab) return false;
    // Convert user role to uppercase for comparison
    const userRole = this.user.role.toUpperCase();
    return tab.roles.includes(userRole);
  }

  navigateToAddProperty(): void {
    // Navigate to add property form
    this.router.navigate(['/add-property']);
  }

  navigateToSearchProperties(): void {
    // Navigate to properties search page
    this.router.navigate(['/properties']);
  }
}