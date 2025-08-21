import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService } from '../../../core/services/agency.service';
import { PropertyService } from '../../../core/services/property.service';
import { CategoryService } from '../../../core/services/category.service';
import { Agency } from '../../../core/models/agency.model';
import { Property } from '../../../core/models/property.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-agency-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agency-list.component.html',
  styleUrls: ['./agency-list.component.css']
})
export class AgencyListComponent implements OnInit {
  Math = Math; // Add this for template access
  
  agencies: Agency[] = [];
  filteredAgencies: Agency[] = [];
  displayedAgencies: Agency[] = [];
  loading = false;
  error: string | null = null;
  
  // Sidebar data
  featuredProperties: Property[] = [];
  recentlyViewed: Property[] = [];
  categories: Category[] = [];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 9;
  totalItems = 0;
  totalPages = 0;
  
  // Search and filters
  searchTerm = '';
  selectedCity = '';
  selectedSpecialization = '';
  sortBy = 'rating';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Available filter options
  cities: string[] = [];
  specializations: string[] = [];
  
  constructor(
    private agencyService: AgencyService,
    private propertyService: PropertyService,
    private categoryService: CategoryService
  ) {}
  
  ngOnInit(): void {
    this.loadAgencies();
    this.loadFeaturedProperties();
    this.loadCategories();
    this.loadRecentlyViewed();
  }
  
  loadAgencies(): void {
    this.loading = true;
    this.error = null;
    
    this.agencyService.getAgencies().subscribe({
      next: (data) => {
        this.agencies = data;
        this.extractFilterOptions();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load agencies. Please try again.';
        this.loading = false;
        console.error('Error loading agencies:', error);
      }
    });
  }
  
  loadFeaturedProperties(): void {
    this.propertyService.getFeaturedProperties().subscribe({
      next: (data) => {
        this.featuredProperties = data.slice(0, 5); // Limit to 5 featured properties
      },
      error: (error) => {
        console.error('Error loading featured properties:', error);
      }
    });
  }
  
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }
  
  loadRecentlyViewed(): void {
    // Get from localStorage or a service
    const recentlyViewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (recentlyViewedIds.length > 0) {
      this.propertyService.getProperties().subscribe({
        next: (properties) => {
          this.recentlyViewed = properties.filter(p => recentlyViewedIds.includes(p._id)).slice(0, 3);
        },
        error: (error) => {
          console.error('Error loading recently viewed properties:', error);
        }
      });
    }
  }
  
  extractFilterOptions(): void {
    const citySet = new Set<string>();
    const specializationSet = new Set<string>();
    
    this.agencies.forEach(agency => {
      if (agency.address) {
        const city = agency.address.split(',').pop()?.trim();
        if (city) citySet.add(city);
      }
      if (agency.specializations) {
        agency.specializations.forEach(spec => specializationSet.add(spec));
      }
    });
    
    this.cities = Array.from(citySet).sort();
    this.specializations = Array.from(specializationSet).sort();
  }
  
  applyFilters(): void {
    let filtered = [...this.agencies];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(agency => 
        agency.name.toLowerCase().includes(term) ||
        agency.description.toLowerCase().includes(term) ||
        agency.address.toLowerCase().includes(term)
      );
    }
    
    // Apply city filter
    if (this.selectedCity) {
      filtered = filtered.filter(agency => 
        agency.address.toLowerCase().includes(this.selectedCity.toLowerCase())
      );
    }
    
    // Apply specialization filter
    if (this.selectedSpecialization) {
      filtered = filtered.filter(agency => 
        agency.specializations?.includes(this.selectedSpecialization)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'foundedYear':
          aValue = a.foundedYear;
          bValue = b.foundedYear;
          break;
        case 'totalReviews':
          aValue = a.totalReviews;
          bValue = b.totalReviews;
          break;
        default:
          aValue = a.rating;
          bValue = b.rating;
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    this.filteredAgencies = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
    this.updateDisplayedAgencies();
  }
  
  updateDisplayedAgencies(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedAgencies = this.filteredAgencies.slice(startIndex, endIndex);
  }
  
  onSearch(): void {
    this.applyFilters();
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  onSortChange(): void {
    this.applyFilters();
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedAgencies();
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedAgencies();
    }
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedAgencies();
    }
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCity = '';
    this.selectedSpecialization = '';
    this.sortBy = 'rating';
    this.sortOrder = 'desc';
    this.applyFilters();
  }
  
  getAgencyImage(agency: Agency): string {
    if (agency.logo) {
      return `http://localhost:3000${agency.logo}`;
    }
    return 'assets/images/default-agency.jpg';
  }
  
  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
  
  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }
  
  getPageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  getAgencySlug(agency: Agency): string {
    return agency.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  getPropertyImage(property: Property): string {
    if (property.media && property.media.length > 0) {
      const primaryImage = property.media.find(m => m.isPrimary) || property.media[0];
      return `http://localhost:3000${primaryImage.url}`;
    }
    return 'assets/images/default-property.jpg';
  }
  
  getPropertyPrice(property: Property): string {
    if (property.pricing?.price) {
      const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: property.pricing.currency || 'USD',
        minimumFractionDigits: 0
      }).format(property.pricing.price);
      
      return property.listingType === 'rent' ? `${price}/mo` : price;
    }
    return 'Price on request';
  }
  
  getCategoryPropertyCount(category: Category): number {
    // This would need to be implemented based on your property-category relationship
    return 0; // Placeholder
  }
}
