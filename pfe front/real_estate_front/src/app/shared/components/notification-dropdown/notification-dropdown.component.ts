import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { type Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';
// import { ClickOutsideDirective } from '../../../directives/click-outside.directive';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isDropdownOpen = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('NotificationDropdownComponent initializing...');
    
    // Add some test notifications for debugging
    this.addTestNotifications();
    
    // Request notification permission
    this.notificationService.requestNotificationPermission();

    // Subscribe to notifications stream
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        console.log('Received notifications:', notifications);
        this.notifications = notifications.slice(0, 10); // Show only latest 10
        this.cdr.detectChanges();
      })
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        console.log('Unread count updated:', count);
        this.unreadCount = count;
        this.cdr.detectChanges();
      })
    );
  }

  addTestNotifications(): void {
    // Add some test notifications to see if the dropdown works
    const testNotifications: Notification[] = [
      {
        id: '1',
        userId: 'test',
        type: 'new_message',
        title: 'Test Notification 1',
        message: 'This is a test notification to check if the dropdown works',
        isRead: false,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        userId: 'test',
        type: 'booking_confirmed',
        title: 'Test Notification 2',
        message: 'Another test notification',
        isRead: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        updatedAt: new Date(Date.now() - 3600000)
      }
    ];
    
    this.notifications = testNotifications;
    this.unreadCount = testNotifications.filter(n => !n.isRead).length;
    console.log('Test notifications added:', this.notifications);
    console.log('Test unread count:', this.unreadCount);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    console.log('Toggle dropdown clicked. Current state:', this.isDropdownOpen);
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('New state:', this.isDropdownOpen);
    console.log('Notifications count:', this.notifications.length);
    console.log('Unread count:', this.unreadCount);
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id || notification._id || index.toString();
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
      // Check all possible user storage keys used in the app
      const userStr = localStorage.getItem('current_user') || 
                     localStorage.getItem('user') || 
                     localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  deleteNotification(notificationId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        console.log('Notification deleted');
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  deleteAllNotifications(): void {
    if (confirm('Are you sure you want to delete all notifications?')) {
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
    console.log('🔔 Notification clicked:', notification);
    console.log('🔔 Notification type:', notification.type);
    console.log('🔔 Related ID:', notification.relatedId);
    console.log('🔔 Related type:', notification.relatedType);
    console.log('🔔 Notification data:', notification.data);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      this.markAsRead(this.getNotificationId(notification));
    }
    
    // Navigate to related content using Angular Router
    this.navigateToRelatedContent(notification);
    
    // Close dropdown
    this.closeDropdown();
  }

  private navigateToRelatedContent(notification: Notification): void {
    console.log('🚀 Starting navigation for notification:', notification.type);
    console.log('🚀 RelatedId:', notification.relatedId, 'RelatedType:', notification.relatedType);
    
    if (!notification.relatedId || !notification.relatedType) {
      console.log('🚀 No relatedId or relatedType, navigating to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Handle specific notification types first
    if (notification.type === 'post_reviewed') {
      console.log('🚀 Post review notification - navigating to post with reviews section');
      // For post reviews, use the relatedId as the slug (since we fixed backend to send slug as relatedId)
      const postSlug = notification.relatedId;
      console.log('🚀 Using post slug for navigation:', postSlug);
      this.router.navigate(['/posts', postSlug], { fragment: 'reviews' });
      return;
    }

    // Use the route mapping for other notification types
    const routeMap: { [key: string]: string } = {
      'property': `/property/${notification.relatedId}`,
      'transaction': `/profile/transactions`,
      'message': `/messages`,
      'payment': `/profile/transactions`,
      'viewing': `/profile/bookings`,
      'booking': `/profile/bookings`,
      'post': `/posts/${notification.relatedId}`,
      'review': `/property/${notification.relatedId}`,
      'agency': `/agency/${notification.relatedId}`,
      'agent': `/agent/${notification.relatedId}`
    };
    
    const route = routeMap[notification.relatedType];
    console.log('🚀 Route mapping result for type "' + notification.relatedType + '":', route);
    
    if (route) {
      // Parse the route and navigate
      const segments = route.split('/').filter(segment => segment);
      console.log('🚀 Navigation segments:', segments);
      
      // Handle special cases like fragments
      if (notification.type === 'property_reviewed') {
        console.log('🚀 Property review - navigating with reviews fragment');
        this.router.navigate(['/', ...segments], { fragment: 'reviews' });
      } else {
        console.log('🚀 Regular navigation to:', ['/', ...segments]);
        this.router.navigate(['/', ...segments]);
      }
    } else {
      console.log('🚀 No route found, navigating to dashboard');
      this.router.navigate(['/dashboard']);
    }
  }

  getNotificationIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getNotificationId(notification: Notification): string {
    return notification.id || notification._id || '';
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
}
