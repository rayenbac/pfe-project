import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  selectedPeriod = 'month';
  Math = Math;

  // KPI Data
  kpiData = {
    totalRevenue: 0,
    averagePropertyPrice: 0,
    occupancyRate: 0,
    activeListings: 0,
    bookingConversionRate: 0,
    averageStayDuration: 0
  };

  // Chart Data
  revenueChartData: any[] = [];
  propertyPriceChartData: any[] = [];
  locationPopularityData: any[] = [];
  agentPerformanceData: any[] = [];
  marketTrends: any[] = [];

  constructor() {}

  ngOnInit() {
    this.loadAnalyticsData();
  }

  async loadAnalyticsData() {
    this.loading = true;
    this.error = null;

    try {
      // Simulate API calls - replace with actual analytics service
      await this.loadKPIData();
      await this.loadChartData();
      await this.loadMarketTrends();
    } catch (error: any) {
      this.error = error.message || 'Failed to load analytics data';
      console.error('Error loading analytics:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadKPIData() {
    // Mock KPI data
    this.kpiData = {
      totalRevenue: 245680,
      averagePropertyPrice: 185000,
      occupancyRate: 78.5,
      activeListings: 342,
      bookingConversionRate: 12.8,
      averageStayDuration: 4.2
    };
  }

  async loadChartData() {
    // Mock revenue data
    this.revenueChartData = [
      { month: 'Jan', revenue: 45000, bookings: 120 },
      { month: 'Feb', revenue: 52000, bookings: 135 },
      { month: 'Mar', revenue: 48000, bookings: 128 },
      { month: 'Apr', revenue: 61000, bookings: 155 },
      { month: 'May', revenue: 55000, bookings: 142 },
      { month: 'Jun', revenue: 67000, bookings: 168 }
    ];

    // Mock property price data
    this.propertyPriceChartData = [
      { type: 'Apartment', avgPrice: 150000, count: 156 },
      { type: 'Villa', avgPrice: 280000, count: 89 },
      { type: 'House', avgPrice: 195000, count: 134 },
      { type: 'Studio', avgPrice: 85000, count: 67 },
      { type: 'Penthouse', avgPrice: 450000, count: 23 }
    ];

    // Mock location popularity
    this.locationPopularityData = [
      { city: 'Dubai', properties: 145, bookings: 89, avgPrice: 220000 },
      { city: 'Abu Dhabi', properties: 98, bookings: 56, avgPrice: 185000 },
      { city: 'Sharjah', properties: 76, bookings: 34, avgPrice: 125000 },
      { city: 'Ajman', properties: 45, bookings: 23, avgPrice: 95000 },
      { city: 'Ras Al Khaimah', properties: 32, bookings: 18, avgPrice: 110000 }
    ];

    // Mock agent performance
    this.agentPerformanceData = [
      { name: 'Ahmed Hassan', properties: 23, revenue: 145000, rating: 4.8 },
      { name: 'Sarah Al-Mansoori', properties: 19, revenue: 128000, rating: 4.9 },
      { name: 'Omar Khalil', properties: 17, revenue: 112000, rating: 4.7 },
      { name: 'Fatima Abdullah', properties: 15, revenue: 98000, rating: 4.6 },
      { name: 'Mohammed Ali', properties: 14, revenue: 89000, rating: 4.5 }
    ];
  }

  async loadMarketTrends() {
    this.marketTrends = [
      {
        trend: 'Property Prices',
        change: '+8.5%',
        direction: 'up',
        description: 'Average property prices increased by 8.5% compared to last quarter'
      },
      {
        trend: 'Booking Volume',
        change: '+15.2%',
        direction: 'up',
        description: 'Total bookings increased by 15.2% this month'
      },
      {
        trend: 'Average Stay Duration',
        change: '-2.1%',
        direction: 'down',
        description: 'Average stay duration decreased slightly'
      },
      {
        trend: 'Cancellation Rate',
        change: '-5.8%',
        direction: 'down',
        description: 'Cancellation rate improved (decreased) by 5.8%'
      }
    ];
  }

  onPeriodChange() {
    this.loadAnalyticsData();
  }

  exportAnalytics() {
    // Implement export functionality
    console.log('Exporting analytics data...');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getChangeIcon(direction: string): string {
    return direction === 'up' ? 'flaticon-arrow-up' : 'flaticon-arrow-down';
  }

  getChangeClass(direction: string): string {
    return direction === 'up' ? 'trend-up' : 'trend-down';
  }
}
