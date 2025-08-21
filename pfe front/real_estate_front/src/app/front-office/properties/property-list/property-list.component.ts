import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/property.model';
import { 
  FeaturedPropertiesSidebarComponent,
  CategoriesPropertiesSidebarComponent,
  RecentlyViewedSidebarComponent
} from '../../../shared/components/sidebar';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    FeaturedPropertiesSidebarComponent,
    CategoriesPropertiesSidebarComponent,
    RecentlyViewedSidebarComponent
  ],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.css'
})
export class PropertyListComponent implements OnInit {
  Math = Math; // Add this for template access

  properties: Property[] = [];
  filteredProperties: Property[] = [];
  displayedProperties: Property[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 9;
  totalItems = 0;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedCity = '';
  minPrice = '';
  maxPrice = '';
  minArea = '';
  maxArea = '';
  minBedrooms = '';
  maxBedrooms = '';
  minBathrooms = '';
  maxBathrooms = '';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Available filter options
  propertyTypes: string[] = [];
  cities: string[] = [];
  priceRanges = [
    { label: 'Under $100,000', min: 0, max: 100000 },
    { label: '$100,000 - $250,000', min: 100000, max: 250000 },
    { label: '$250,000 - $500,000', min: 250000, max: 500000 },
    { label: '$500,000 - $1,000,000', min: 500000, max: 1000000 },
    { label: 'Over $1,000,000', min: 1000000, max: Infinity }
  ];

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.error = null;

    this.propertyService.getProperties().subscribe({
      next: (data) => {
        console.log('Properties loaded:', data);
        console.log('Sample property structure:', data[0]);
        if (data[0]) {
          console.log('listingType of first property:', data[0].listingType);
        }
        
        this.properties = data;
        this.extractFilterOptions();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load properties. Please try again.';
        this.loading = false;
        console.error('Error fetching properties:', error);
      }
    });
  }

  extractFilterOptions(): void {
    const typeSet = new Set<string>();
    const citySet = new Set<string>();

    this.properties.forEach(property => {
      if (property.type) {
        typeSet.add(property.type);
      }
      if (property.address && property.address.city) {
        citySet.add(property.address.city);
      }
    });

    this.propertyTypes = Array.from(typeSet).sort();
    this.cities = Array.from(citySet).sort();
  }

  applyFilters(): void {
    // If we have search criteria, use the searchProperties method
    if (this.hasSearchCriteria()) {
      this.performSearch();
    } else {
      // Otherwise, use the regular filtering
      this.performClientSideFiltering();
    }
  }

  private hasSearchCriteria(): boolean {
    return !!(this.searchTerm || this.selectedType || this.selectedStatus || 
              this.selectedCity || this.minPrice || this.maxPrice || 
              this.minArea || this.maxArea ||
              this.minBedrooms || this.maxBedrooms || this.minBathrooms || this.maxBathrooms);
  }

  private performSearch(): void {
    this.loading = true;
    this.error = null;
    
    // Prepare search criteria
    const searchCriteria = this.prepareSearchCriteria();
    
    console.log('Search criteria:', searchCriteria);
    console.log('Selected status:', this.selectedStatus);
    console.log('Selected type:', this.selectedType);
    
    // Call the property service to search for properties
    this.propertyService.searchProperties(searchCriteria).subscribe({
      next: (results) => {
        console.log('Search results received:', results);
        console.log('Number of results:', results.length);
        
        this.filteredProperties = results;
        this.totalItems = results.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.updateDisplayedProperties();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching properties:', error);
        this.loading = false;
        this.error = 'Failed to search properties. Please try again.';
      }
    });
  }

  private prepareSearchCriteria(): any {
    const criteria: any = {};

    if (this.searchTerm) criteria.keyword = this.searchTerm;
    if (this.selectedType) criteria.type = this.selectedType;
    if (this.selectedStatus) criteria.listingType = this.selectedStatus;
    if (this.selectedCity) criteria.location = this.selectedCity;
    
    if (this.minPrice || this.maxPrice) {
      criteria.price = {};
      if (this.minPrice) criteria.price.min = Number(this.minPrice);
      if (this.maxPrice) criteria.price.max = Number(this.maxPrice);
    }

    if (this.minArea || this.maxArea) {
      criteria.area = {};
      if (this.minArea) criteria.area.min = Number(this.minArea);
      if (this.maxArea) criteria.area.max = Number(this.maxArea);
    }
    
    if (this.minBedrooms) criteria.bedrooms = Number(this.minBedrooms);
    if (this.minBathrooms) criteria.bathrooms = Number(this.minBathrooms);
    
    return criteria;
  }

  private performClientSideFiltering(): void {
    console.log('Performing client-side filtering...');
    console.log('Selected status:', this.selectedStatus);
    console.log('Selected type:', this.selectedType);
    
    let filtered = [...this.properties];
    console.log('Initial properties count:', filtered.length);

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(term) ||
        property.description?.toLowerCase().includes(term) ||
        property.address.street.toLowerCase().includes(term) ||
        property.address.city.toLowerCase().includes(term) ||
        property.address.state.toLowerCase().includes(term)
      );
      console.log('After search filter:', filtered.length);
    }

    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(property => property.type === this.selectedType);
      console.log('After type filter:', filtered.length);
    }

    // Apply status filter
    if (this.selectedStatus) {
      console.log('Applying status filter. Looking for listingType:', this.selectedStatus);
      const beforeCount = filtered.length;
      filtered = filtered.filter(property => {
        console.log(`Property ${property.title} has listingType: ${property.listingType}`);
        return property.listingType === this.selectedStatus;
      });
      console.log(`After status filter: ${filtered.length} (was ${beforeCount})`);
    }

    // Apply city filter
    if (this.selectedCity) {
      filtered = filtered.filter(property => 
        property.address.city.toLowerCase().includes(this.selectedCity.toLowerCase())
      );
    }

    // Apply price filters
    if (this.minPrice) {
      filtered = filtered.filter(property => property.pricing.price >= Number(this.minPrice));
    }
    if (this.maxPrice) {
      filtered = filtered.filter(property => property.pricing.price <= Number(this.maxPrice));
    }

    // Apply area filters
    if (this.minArea) {
      filtered = filtered.filter(property => property.size.total >= Number(this.minArea));
    }
    if (this.maxArea) {
      filtered = filtered.filter(property => property.size.total <= Number(this.maxArea));
    }

    // Apply bedroom filters
    if (this.minBedrooms) {
      filtered = filtered.filter(property => property.bedrooms >= Number(this.minBedrooms));
    }
    if (this.maxBedrooms) {
      filtered = filtered.filter(property => property.bedrooms <= Number(this.maxBedrooms));
    }

    // Apply bathroom filters
    if (this.minBathrooms) {
      filtered = filtered.filter(property => property.bathrooms >= Number(this.minBathrooms));
    }
    if (this.maxBathrooms) {
      filtered = filtered.filter(property => property.bathrooms <= Number(this.maxBathrooms));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.pricing.price;
          bValue = b.pricing.price;
          break;
        case 'area':
          aValue = a.size.total;
          bValue = b.size.total;
          break;
        case 'bedrooms':
          aValue = a.bedrooms;
          bValue = b.bedrooms;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredProperties = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
    this.updateDisplayedProperties();
  }

  updateDisplayedProperties(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedProperties = this.filteredProperties.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.error = null; // Clear any previous errors
    this.applyFilters();
  }

  onSortChange(): void {
    this.error = null; // Clear any previous errors
    this.applyFilters();
  }

  onSearch(): void {
    this.error = null; // Clear any previous errors
    this.applyFilters();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedProperties();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedProperties();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedProperties();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedCity = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.minArea = '';
    this.maxArea = '';
    this.minBedrooms = '';
    this.maxBedrooms = '';
    this.minBathrooms = '';
    this.maxBathrooms = '';
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.applyFilters();
  }

  getImageUrl(media: any[]): string {
    if (media && media.length > 0) {
      return 'http://localhost:3000' + media[0].url;
    }
    return 'assets/images/default-property.jpg';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getPropertySlug(property: Property): string {
    return PropertyService.createSlug(property.title);
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

  filterByType(type: string): void {
    this.selectedType = type;
    this.applyFilters();
  }

  goToPropertyDetails(property: Property): void {
    const slug = this.getPropertySlug(property);
    this.router.navigate(['/property', slug]);
  }

  onCardClick(property: Property): void {
    this.goToPropertyDetails(property);
  }

  getPropertyCountByType(type: string): number {
    return this.properties.filter(property => property.type === type).length;
  }
}
