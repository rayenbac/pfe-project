import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardStatistics, QuickStats } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  dropdownOpen = false;
  loading = true;
  
  // Statistics data
  statistics: DashboardStatistics | null = null;
  quickStats: QuickStats | null = null;
  
  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    console.log('Dashboard component loaded');
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load both statistics and quick stats
    Promise.all([
      this.dashboardService.getDashboardStatistics().toPromise(),
      this.dashboardService.getQuickStats().toPromise()
    ]).then(([statsResponse, quickStatsResponse]) => {
      if (statsResponse?.success) {
        this.statistics = statsResponse.data;
      }
      if (quickStatsResponse?.success) {
        this.quickStats = quickStatsResponse.data;
      }
      this.loading = false;
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Helper methods
  formatNumber(num: number): string {
    return this.dashboardService.formatNumber(num);
  }

  getTimeAgo(date: string): string {
    return this.dashboardService.getTimeAgo(date);
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'available': 'flaticon-home text-success',
      'sold': 'flaticon-sold text-danger',
      'rented': 'flaticon-key text-warning',
      'pending': 'flaticon-clock text-info',
      'off-market': 'flaticon-inactive text-muted'
    };
    return icons[status] || 'flaticon-home text-secondary';
  }

  getPropertyTypesSafe() {
    return this.statistics?.charts?.propertyTypes || [];
  }

  getPropertyStatusSafe() {
    return this.statistics?.charts?.propertyStatus || [];
  }

  getMaxPropertyTypeCount(): number {
    const types = this.getPropertyTypesSafe();
    return types.length > 0 ? types[0].count : 1;
  }
}
