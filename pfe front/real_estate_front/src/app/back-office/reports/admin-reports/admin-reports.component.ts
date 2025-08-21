import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { Report, ReportStatistics } from '../../../core/models/report.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  filteredReports: Report[] = [];
  statistics: ReportStatistics | null = null;
  loading = false;
  
  // Filters
  filters = {
    status: '',
    targetType: '',
    priority: '',
    search: ''
  };
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  totalItems = 0;
  
  // Selection for bulk operations
  selectedReports: Set<string> = new Set();
  selectAll = false;
  
  // Sort
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    public reportService: ReportService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadReports();
    this.loadStatistics();
  }

  loadReports(): void {
    this.loading = true;
    this.reportService.getReports({
      status: this.filters.status || undefined,
      targetType: this.filters.targetType || undefined,
      priority: this.filters.priority || undefined,
      page: this.currentPage,
      limit: this.itemsPerPage
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.reports = response.data;
          this.filteredReports = [...this.reports];
          this.totalPages = response.pagination.totalPages;
          this.totalItems = response.pagination.totalItems;
          this.applyLocalFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: 'Failed to load reports',
          icon: 'error'
        });
      }
    });
  }

  loadStatistics(): void {
    this.reportService.getReportStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  applyLocalFilters(): void {
    let filtered = [...this.reports];
    
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.reason.toLowerCase().includes(searchTerm) ||
        report.category?.toLowerCase().includes(searchTerm) ||
        `${report.reporterId.firstName} ${report.reporterId.lastName}`.toLowerCase().includes(searchTerm)
      );
    }
    
    this.filteredReports = filtered;
    this.sortReports();
  }

  sortReports(): void {
    this.filteredReports.sort((a, b) => {
      let aValue: any = a[this.sortField as keyof Report];
      let bValue: any = b[this.sortField as keyof Report];
      
      if (this.sortField === 'reporterId') {
        aValue = `${a.reporterId.firstName} ${a.reporterId.lastName}`;
        bValue = `${b.reporterId.firstName} ${b.reporterId.lastName}`;
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  onSearchChange(): void {
    this.applyLocalFilters();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortReports();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReports();
  }

  // Selection methods
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.filteredReports.forEach(report => this.selectedReports.add(report._id));
    } else {
      this.selectedReports.clear();
    }
  }

  toggleSelectReport(reportId: string): void {
    if (this.selectedReports.has(reportId)) {
      this.selectedReports.delete(reportId);
    } else {
      this.selectedReports.add(reportId);
    }
    this.selectAll = this.selectedReports.size === this.filteredReports.length;
  }

  // Report actions
  updateReportStatus(report: Report, newStatus: string): void {
    Swal.fire({
      title: 'Update Report Status',
      text: `Are you sure you want to mark this report as ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reportService.updateReport(report._id, { status: newStatus as any }).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadReports();
              Swal.fire('Updated!', 'Report status has been updated.', 'success');
            }
          },
          error: (error) => {
            console.error('Error updating report:', error);
            Swal.fire('Error', 'Failed to update report status', 'error');
          }
        });
      }
    });
  }

  bulkUpdateStatus(status: string): void {
    if (this.selectedReports.size === 0) {
      Swal.fire('Warning', 'Please select at least one report', 'warning');
      return;
    }

    Swal.fire({
      title: 'Bulk Update',
      text: `Update ${this.selectedReports.size} reports to ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update all'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reportService.bulkUpdateReports({
          reportIds: Array.from(this.selectedReports),
          updateData: { status: status as any }
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.selectedReports.clear();
              this.selectAll = false;
              this.loadReports();
              Swal.fire('Updated!', `${response.data.modifiedCount} reports updated.`, 'success');
            }
          },
          error: (error) => {
            console.error('Error bulk updating reports:', error);
            Swal.fire('Error', 'Failed to update reports', 'error');
          }
        });
      }
    });
  }

  viewReportDetails(report: Report): void {
    // Navigate to detailed view or show modal
    // For now, show a simple alert with details
    Swal.fire({
      title: 'Report Details',
      html: `
        <div class="text-left">
          <p><strong>Reporter:</strong> ${report.reporterId.firstName} ${report.reporterId.lastName}</p>
          <p><strong>Target:</strong> ${report.targetType} (ID: ${report.targetId})</p>
          <p><strong>Category:</strong> ${this.reportService.getReportCategoryDisplayName(report.category || '')}</p>
          <p><strong>Priority:</strong> ${report.priority}</p>
          <p><strong>Status:</strong> ${this.reportService.getStatusDisplayName(report.status)}</p>
          <p><strong>Reason:</strong></p>
          <p class="border p-2 bg-light">${report.reason}</p>
          ${report.adminNotes ? `<p><strong>Admin Notes:</strong></p><p class="border p-2 bg-light">${report.adminNotes}</p>` : ''}
        </div>
      `,
      width: '600px',
      showCloseButton: true
    });
  }

  deleteReport(report: Report): void {
    Swal.fire({
      title: 'Delete Report',
      text: 'Are you sure you want to delete this report? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reportService.deleteReport(report._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadReports();
              Swal.fire('Deleted!', 'Report has been deleted.', 'success');
            }
          },
          error: (error) => {
            console.error('Error deleting report:', error);
            Swal.fire('Error', 'Failed to delete report', 'error');
          }
        });
      }
    });
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    return `badge bg-${this.reportService.getStatusColor(status)}`;
  }

  getPriorityBadgeClass(priority: string): string {
    return `badge bg-${this.reportService.getPriorityColor(priority)}`;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
