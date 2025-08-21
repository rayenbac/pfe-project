import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AgencyService } from '../../core/services/agency.service';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agencies.component.html',
  styleUrls: ['./agencies.component.css']
})
export class AgenciesComponent implements OnInit {
  agencies: any[] = [];
  filteredAgencies: any[] = [];
  loading = false;
  error: string | null = null;

  // Make Math available in template
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  statusFilter = '';

  constructor(private agencyService: AgencyService) {}

  ngOnInit() {
    this.loadAgencies();
  }

  async loadAgencies() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.agencyService.getAgencies().toPromise();
      this.agencies = response || [];
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load agencies';
      console.error('Error loading agencies:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.agencies];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(agency => 
        agency.name?.toLowerCase().includes(term) ||
        agency.email?.toLowerCase().includes(term) ||
        agency.phone?.toLowerCase().includes(term) ||
        agency.address?.city?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(agency => {
        if (this.statusFilter === 'verified') return agency.isVerified;
        if (this.statusFilter === 'unverified') return !agency.isVerified;
        if (this.statusFilter === 'active') return agency.isActive;
        if (this.statusFilter === 'inactive') return !agency.isActive;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getNestedValue(a, this.sortField);
      const bValue = this.getNestedValue(b, this.sortField);
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredAgencies = filtered;
    this.totalPages = Math.ceil(this.filteredAgencies.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj) || '';
  }

  getPaginatedAgencies() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAgencies.slice(start, end);
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  async toggleAgencyStatus(agency: any) {
    if (confirm(`Are you sure you want to ${agency.isActive ? 'deactivate' : 'activate'} this agency?`)) {
      try {
        // For now, just update locally - implement actual API call later
        agency.isActive = !agency.isActive;
        console.log('Toggle agency status:', agency._id, agency.isActive);
      } catch (error: any) {
        this.error = error.message || 'Failed to update agency status';
      }
    }
  }

  async verifyAgency(agency: any) {
    if (confirm('Are you sure you want to verify this agency?')) {
      try {
        // For now, just update locally - implement actual API call later
        agency.isVerified = true;
        console.log('Verify agency:', agency._id);
      } catch (error: any) {
        this.error = error.message || 'Failed to verify agency';
      }
    }
  }

  async deleteAgency(agency: any) {
    if (confirm('Are you sure you want to delete this agency? This action cannot be undone.')) {
      try {
        await this.agencyService.deleteAgency(agency._id).toPromise();
        this.loadAgencies();
      } catch (error: any) {
        this.error = error.message || 'Failed to delete agency';
      }
    }
  }

  trackByAgencyId(index: number, agency: any): string {
    return agency._id;
  }

  getStatusClass(agency: any): string {
    if (!agency.isActive) return 'status-inactive';
    if (agency.isVerified) return 'status-verified';
    return 'status-pending';
  }

  getStatusText(agency: any): string {
    if (!agency.isActive) return 'Inactive';
    if (agency.isVerified) return 'Verified';
    return 'Pending';
  }
}
