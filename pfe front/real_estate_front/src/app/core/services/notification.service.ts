import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { type Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiBaseUrl}/notifications`;
  private socket: Socket;
  
  // Reactive streams for notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000', {
      autoConnect: false
    });
    
    this.setupSocketListeners();
    this.initializeConnection();
  }

  private initializeConnection(): void {
    console.log('Initializing notification service connection...');
    // Check if user is authenticated and get user data
    const currentUser = this.getCurrentUser();
    console.log('Current user:', currentUser);
    if (currentUser && currentUser._id) {
      console.log('User found, connecting socket and loading notifications...');
      this.connectSocket(currentUser._id);
      this.loadUserNotifications(currentUser._id);
    } else {
      console.log('No authenticated user found');
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

  private connectSocket(userId: string): void {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('user_connected', userId);
      this.socket.emit('join_notifications', userId);
    }
  }

  private disconnectSocket(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  private setupSocketListeners(): void {
    // Listen for new notifications
    this.socket.on('new_notification', (data: { notification: Notification, data?: any }) => {
      console.log('🔔 Frontend received new notification:', data);
      console.log('🔔 Notification object:', data.notification);
      console.log('🔔 Notification type:', data.notification?.type);
      console.log('🔔 Notification relatedId:', data.notification?.relatedId);
      console.log('🔔 Notification relatedType:', data.notification?.relatedType);
      
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = [data.notification, ...currentNotifications];
      
      this.notificationsSubject.next(updatedNotifications);
      this.updateUnreadCount();
      
      // Show browser notification if permission granted
      this.showBrowserNotification(data.notification);
    });

    // Listen for notification read events
    this.socket.on('notification_read', (data: { notificationId: string }) => {
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = currentNotifications.map(notification =>
        notification.id === data.notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      this.notificationsSubject.next(updatedNotifications);
      this.updateUnreadCount();
    });

    // Listen for notification deleted events
    this.socket.on('notification_deleted', (data: { notificationId: string }) => {
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = currentNotifications.filter(
        notification => notification.id !== data.notificationId
      );
      
      this.notificationsSubject.next(updatedNotifications);
      this.updateUnreadCount();
    });

    // Listen for all notifications deleted
    this.socket.on('all_notifications_deleted', () => {
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification socket');
    });
  }

  // HTTP API methods
  loadUserNotifications(userId: string): void {
    console.log('Loading notifications for user:', userId);
    this.getUserNotifications(userId).subscribe({
      next: (notifications) => {
        console.log('Notifications loaded successfully:', notifications);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  getUserNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getUnreadNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}/unread`, {
      headers: this.getHeaders()
    });
  }

  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${notificationId}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  markAllAsRead(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/${userId}/read-all`, {}, {
      headers: this.getHeaders()
    });
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`, {
      headers: this.getHeaders()
    });
  }

  deleteAllNotifications(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/all`, {
      headers: this.getHeaders()
    });
  }

  // UI Helper methods
  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        tag: notification.id || notification._id
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'new_booking': 'calendar',
      'booking_confirmed': 'check-circle',
      'new_message': 'message-circle',
      'payment_confirmed': 'credit-card',
      'property_reviewed': 'star',
      'favorite_property_updated': 'heart',
      'admin_new_property': 'home',
      'admin_property_updated': 'edit',
      'admin_report_received': 'alert-triangle'
    };
    return iconMap[type] || 'bell';
  }

  getNotificationColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'low': '#6b7280',
      'medium': '#f59e0b',
      'high': '#ef4444'
    };
    return colorMap[priority] || '#6b7280';
  }

  navigateToRelatedContent(notification: Notification): string {
    if (!notification.relatedId || !notification.relatedType) {
      return '/dashboard';
    }

    const routeMap: { [key: string]: string } = {
      'property': `/property/${notification.relatedId}`,
      'transaction': `/profile/transactions`,
      'message': `/messages`,
      'payment': `/profile/transactions`,
      'viewing': `/profile/bookings`,
      'booking': `/profile/bookings`,
      'post': `/posts/${notification.relatedId}`,
      'review': `/property/${notification.relatedId}#reviews`,
      'agency': `/agency/${notification.relatedId}`,
      'agent': `/agent/${notification.relatedId}`
    };

    return routeMap[notification.relatedType] || '/dashboard';
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Cleanup when service is destroyed
  ngOnDestroy(): void {
    this.disconnectSocket();
  }
}
