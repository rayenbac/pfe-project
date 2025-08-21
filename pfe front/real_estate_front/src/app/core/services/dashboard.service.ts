import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStatistics {
  overview: {
    totalProperties: number;
    totalUsers: number;
    totalAgents: number;
    totalAgencies: number;
    totalPosts: number;
    totalReviews: number;
    totalReports: number;
    totalBookings: number;
    pendingPosts: number;
  };
  charts: {
    propertyTypes: Array<{ _id: string; count: number }>;
    propertyStatus: Array<{ _id: string; count: number }>;
    monthlyUsers: Array<{ _id: { year: number; month: number }; count: number }>;
    monthlyRevenue: Array<{ _id: { year: number; month: number }; count: number; revenue: number }>;
    topAgents: Array<{ agentName: string; propertyCount: number; agentId: string }>;
  };
  recentActivities: Array<{
    type: string;
    icon: string;
    title: string;
    time: string;
    link?: string;
    agent?: string;
    reporter?: string;
  }>;
}

export interface QuickStats {
  properties: number;
  users: number;
  agents: number;
  agencies: number;
  posts: number;
  reviews: number;
  reports: number;
  bookings: number;
  pendingPosts: number;
}

export interface PropertyAnalytics {
  byCity: Array<{ _id: string; count: number; avgPrice: number }>;
  byPriceRange: Array<{ _id: number | string; count: number; properties: string[] }>;
  byBedroomCount: Array<{ _id: number; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  // Get complete dashboard statistics
  getDashboardStatistics(): Observable<{ success: boolean; data: DashboardStatistics }> {
    return this.http.get<{ success: boolean; data: DashboardStatistics }>(`${this.apiUrl}/statistics`);
  }

  // Get quick stats for dashboard cards
  getQuickStats(): Observable<{ success: boolean; data: QuickStats }> {
    return this.http.get<{ success: boolean; data: QuickStats }>(`${this.apiUrl}/quick-stats`);
  }

  // Get property analytics
  getPropertyAnalytics(): Observable<{ success: boolean; data: PropertyAnalytics }> {
    return this.http.get<{ success: boolean; data: PropertyAnalytics }>(`${this.apiUrl}/property-analytics`);
  }

  // Helper method to format numbers
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Helper method to get time ago
  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return past.toLocaleDateString();
    }
  }

  // Helper method to get chart colors
  getChartColors(): string[] {
    return [
      '#4F46E5', // Indigo
      '#06B6D4', // Cyan
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
  }
}
