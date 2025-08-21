import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { type Notification, NotificationType } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.css']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  loading = true;
  
  // Filters
  filterStatus = 'all';
  filterType = 'all';
  filterPriority = 'all';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // Statistics
  totalNotifications = 0;
  unreadCount = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadNotifications(): void {
    this.loading = true;
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.totalNotifications = notifications.length;
        this.applyFilters();
        this.updateStatistics();
        this.loading = false;
      })
    );
  }

  private setupRealtimeUpdates(): void {
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  private updateStatistics(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    // Filter by status
    if (this.filterStatus === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (this.filterStatus === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by type
    if (this.filterType !== 'all') {
      const typeMap: { [key: string]: NotificationType[] } = {
        'booking': ['new_booking', 'booking_confirmed'],
        'message': ['new_message'],
        'payment': ['payment_confirmed', 'payment_received', 'payment_failed'],
        'property': ['favorite_property_updated', 'property_status_update', 'admin_new_property', 'admin_property_updated'],
        'review': ['property_reviewed']
      };
      
      if (typeMap[this.filterType]) {
        filtered = filtered.filter(n => typeMap[this.filterType].includes(n.type));
      }
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === this.filterPriority);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }

    this.filteredNotifications = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterType = 'all';
    this.filterPriority = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  getPaginatedNotifications(): Notification[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredNotifications.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredNotifications.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  markAsRead(notificationId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        console.log('Notification marked as read');
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.notificationService.markAllAsRead(currentUser._id).subscribe({
        next: () => {
          console.log('All notifications marked as read');
        },
        error: (error) => {
          console.error('Error marking all notifications as read:', error);
        }
      });
    }
  }

  private getCurrentUser(): any {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  deleteNotification(notificationId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(notificationId).subscribe({
        next: () => {
          console.log('Notification deleted');
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  deleteAllNotifications(): void {
    if (confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      this.notificationService.deleteAllNotifications().subscribe({
        next: () => {
          console.log('All notifications deleted');
        },
        error: (error) => {
          console.error('Error deleting all notifications:', error);
        }
      });
    }
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read if not already read
    if (!notification.isRead) {
      this.markAsRead(this.getNotificationId(notification));
    }
    
    // Navigate to related content
    const url = this.notificationService.navigateToRelatedContent(notification);
    window.location.href = url;
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationColor(priority: string): string {
    return this.notificationService.getNotificationColor(priority);
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  }

  getNotificationId(notification: Notification): string {
    return notification.id || notification._id || '';
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id || notification._id || index.toString();
  }
}
