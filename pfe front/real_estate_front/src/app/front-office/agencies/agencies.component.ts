import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService } from '../../../core/services/agency.service';
import { Agency } from '../../../core/models/agency.model';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agencies.component.html',
  styleUrls: ['./agencies.component.css']
})
export class AgenciesComponent implements OnInit {
  agencies: Agency[] = [];
  filteredAgencies: Agency[] = [];
  loading = true;
  error: string | null = null;
  
  // Search and filter
  searchQuery = '';
  selectedCity = '';
  sortBy = 'name';
  sortOrder = 'asc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  
  // View type
  viewType: 'grid' | 'list' = 'grid';

  constructor(private agencyService: AgencyService) {}

  ngOnInit(): void {
    this.loadAgencies();
  }

  loadAgencies(): void {
    this.loading = true;
    this.agencyService.getAgencies().subscribe({
      next: (agencies) => {
        this.agencies = agencies;
        this.filteredAgencies = agencies;
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading agencies:', error);
        this.error = 'Failed to load agencies';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredAgencies = this.agencies.filter(agency =>
      agency.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      agency.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      agency.address?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    
    if (this.selectedCity) {
      this.filteredAgencies = this.filteredAgencies.filter(agency =>
        agency.address?.toLowerCase().includes(this.selectedCity.toLowerCase())
      );
    }
    
    this.sortAgencies();
    this.currentPage = 1;
    this.updatePagination();
  }

  sortAgencies(): void {
    this.filteredAgencies.sort((a, b) => {
      const aValue = a[this.sortBy as keyof Agency] || '';
      const bValue = b[this.sortBy as keyof Agency] || '';
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAgencies.length / this.itemsPerPage);
  }

  getPaginatedAgencies(): Agency[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAgencies.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  toggleViewType(): void {
    this.viewType = this.viewType === 'grid' ? 'list' : 'grid';
  }

  getAgencyImageUrl(agency: Agency): string {
    return agency.logo ? `http://localhost:3000${agency.logo}` : 'assets/images/default-agency.jpg';
  }

  trackByAgencyId(index: number, agency: Agency): string {
    return agency._id;
  }
}
