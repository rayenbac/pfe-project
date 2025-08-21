import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { CategoryService } from '../../../core/services/category.service';
import { Property } from '../../../core/models/property.model';
import { Category } from '../../../core/models/category.model';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';

declare var $: any;

@Component({
  selector: 'app-property-by-city',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './property-by-city.component.html',
  styleUrl: './property-by-city.component.css'
})
export class PropertyByCityComponent implements OnInit, AfterViewInit, AfterViewChecked {
  city: string = '';
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  displayedProperties: Property[] = [];
  categories: Category[] = [];
  recentlyViewed: Property[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  page = 1;
  pageSize = 6;
  totalPages = 1;
  searchKeyword = '';
  
  // Filtres dynamiques
  searchLocation = '';
  searchStatus = '';
  statusList = ['For Rent', 'For Sale', 'Featured'];
  searchType = '';
  typeList = ['Apartment', 'Bungalow', 'Condo', 'House', 'Land', 'Single Family'];
  minPrice: number|null = null;
  maxPrice: number|null = null;
  searchBathrooms = '';
  bathroomsList = ['1', '2', '3', '4', '5', '6'];
  searchBedrooms = '';
  bedroomsList = ['1', '2', '3', '4', '5', '6'];
  searchGarages = '';
  garagesList = ['Yes', 'No', 'Others'];
  searchYear = '';
  yearList = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020'];
  minArea: number|null = null;
  maxArea: number|null = null;

  // Sidebar dynamiques
  featuredProperties: Property[] = [];

  // Tri et pagination dynamiques
  sortStatus = '';
  sortBy = 'featured';
  totalResults = 0;
  paginatedProperties: Property[] = [];
  currentPage = 1;

  owners: { [userId: string]: User } = {};

  searchForm: FormGroup;
  propertyTypes = [
    'Apartment', 'Bungalow', 'Condo', 'House', 'Land', 'Single Family', 'Villa', 'Studio', 'Penthouse', 'Duplex', 'Townhouse'
  ];
  years = Array.from({ length: 11 }, (_, i) => 2013 + i);
  bathrooms = Array.from({ length: 8 }, (_, i) => i + 1);
  bedrooms = Array.from({ length: 8 }, (_, i) => i + 1);
  amenities = [
    'Air Conditioning', 'Barbeque', 'Dryer', 'Gym', 'Laundry', 'Microwave', 
    'Outdoor Shower', 'Refrigerator', 'Swimming Pool', 'TV Cable', 'Washer', 
    'WiFi', 'Window Coverings', 'Dishwasher', 'Fireplace', 'Hardwood Floors'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private categoryService: CategoryService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.city = params.get('city') || '';
      this.loadProperties();
      this.loadCategories();
      this.loadRecentlyViewed();
    });
    // Initialisation des featuredProperties (exemple: les 3 premières propriétés)
    this.featuredProperties = this.properties.slice(0, 3);

    // Make closeNav available globally
    (window as any).closeNav = () => {
      $('.listing_sidebar').addClass('dn').removeClass('dn-991');
      $('body').removeClass('modal-open');
    };
  }

  ngAfterViewInit(): void {
    console.log('=== ngAfterViewInit START ===');
    this.initPlugins();
    this.initMobileFilter();
    
    // Add debug call with delay to ensure DOM is ready
    setTimeout(() => {
      this.debugMobileFilter();
    }, 500);
    
    console.log('=== ngAfterViewInit END ===');
  }

  ngAfterViewChecked(): void {
    // Only initialize if selectpickers haven't been initialized yet
    if ($('.selectpicker').length > 0 && $('.selectpicker.bs-select-hidden').length === 0) {
      setTimeout(() => {
        this.initPluginsOnce();
      }, 100);
    }
  }

  private selectpickersInitialized = false;

  private initPluginsOnce(): void {
    if (this.selectpickersInitialized) return;
    this.initPlugins();
    this.selectpickersInitialized = true;
  }

  private initPlugins(): void {
    setTimeout(() => {
      try {
        // Destroy any existing selectpickers first
        if ($('.selectpicker').length) {
          $('.selectpicker').each((index: number, element: HTMLElement) => {
            if ($(element).hasClass('bs-select-hidden')) {
              $(element).selectpicker('destroy');
            }
          });
        }

        // Initialize all selectpickers with consistent settings
        if ($('.selectpicker').length) {
          $('.selectpicker').selectpicker({
            style: 'btn-default btn-sm', // Use consistent button style
            size: 4,
            liveSearch: true,
            showSubtext: true,
            width: 'auto', // Let it auto-size instead of 100%
            dropupAuto: false
          });
          
          // Bind change events
          $('.selectpicker').off('changed.bs.select').on('changed.bs.select', (e: any) => {
            const select = e.target as HTMLSelectElement;
            const formControlName = select.getAttribute('formControlName');
            if (formControlName) {
              this.searchForm.get(formControlName)?.setValue(select.value);
              console.log(`${formControlName} changed to:`, select.value);
            }
          });
          
          // Force refresh all selectpickers
          $('.selectpicker').selectpicker('refresh');
          this.selectpickersInitialized = true;
        }

        // Initialize other components
        this.initPriceSlider();
        this.initCustomDropdowns();
        this.initAccordion();

      } catch (error) {
        console.error('Error initializing plugins:', error);
      }
    }, 300); // Increased timeout for better initialization
  }

  private initPriceSlider(): void {
    if ($('.slider-range').length && typeof ($('.slider-range') as any).slider === 'function') {
      ($('.slider-range') as any).slider({
        range: true,
        min: 0,
        max: 1000000,
        values: [0, 1000000],
        slide: (event: any, ui: any) => {
          $('.amount').val('$' + ui.values[0]);
          $('.amount2').val('$' + ui.values[1]);
          
          // Update form controls
          this.searchForm.get('minPrice')?.setValue(ui.values[0]);
          this.searchForm.get('maxPrice')?.setValue(ui.values[1]);
        }
      });
    }
  }

  private initCustomDropdowns(): void {
    if ($('.small_dropdown2 .btn.dd_btn').length) {
      $('.small_dropdown2 .btn.dd_btn').off('click').on('click', function(this: HTMLElement) {
        $(this).next('.dd_content2').slideToggle(200);
      });
    }
  }

  private initAccordion(): void {
    if ($('.accordion-toggle.link').length) {
      $('.accordion-toggle.link').off('click').on('click', function(this: HTMLElement, event: Event) {
        event.preventDefault();
        const $target = $($(this).attr('href') as string);
        $target.collapse('toggle');
      });
    }
  }

  // Pour compatibilité avec l'attribut onclick="closeNav()" dans le HTML
  closeNav(): void {
    $('.listing_sidebar').removeClass('active');
    $('.wrapper').removeClass('sidebar-open');
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.properties = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des propriétés';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      }
    });
  }

  loadRecentlyViewed(): void {
    const stored = localStorage.getItem('recentlyViewedProperties');
    if (stored) {
      this.recentlyViewed = JSON.parse(stored);
    }
  }

  addToRecentlyViewed(property: Property): void {
    const exists = this.recentlyViewed.find(p => p._id === property._id);
    if (!exists) {
      this.recentlyViewed.unshift(property);
      if (this.recentlyViewed.length > 3) this.recentlyViewed = this.recentlyViewed.slice(0, 3);
      localStorage.setItem('recentlyViewedProperties', JSON.stringify(this.recentlyViewed));
    }
  }

  applyFilters(): void {
    // Filtre par ville, mot-clé, et autres filtres dynamiques
    try {
      this.filteredProperties = this.properties.filter(p =>
        p.address.city && p.address.city.toLowerCase() === this.city.toLowerCase() &&
        (!this.searchKeyword || p.title.toLowerCase().includes(this.searchKeyword.toLowerCase())) &&
        (!this.searchLocation || p.address.city.toLowerCase().includes(this.searchLocation.toLowerCase())) &&
        (!this.searchStatus || this.getStatus(p) === this.searchStatus) &&
        (!this.searchType || p.type === this.searchType) &&
        (!this.minPrice || this.getPrice(p) >= this.minPrice) &&
        (!this.maxPrice || this.getPrice(p) <= this.maxPrice) &&
        (!this.searchBathrooms || p.bathrooms == +this.searchBathrooms) &&
        (!this.searchBedrooms || p.bedrooms == +this.searchBedrooms) &&
        (!this.searchGarages || this.getGarages(p) == +this.searchGarages) &&
        (!this.searchYear || p.yearBuilt == +this.searchYear) &&
        (!this.minArea || this.getArea(p) >= this.minArea) &&
        (!this.maxArea || this.getArea(p) <= this.maxArea)
      );
      console.log('Résultats filtrés :', this.filteredProperties);
      this.totalResults = this.filteredProperties.length;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize) || 1;
      this.currentPage = 1;
      this.applySort();
      this.updatePaginatedProperties();
    } catch (error) {
      console.error('Erreur dans applyFilters:', error);
    }
  }

  applySort(): void {
    // Tri principal
    if (this.sortBy === 'priceAsc') {
      this.filteredProperties.sort((a, b) => this.getPrice(a) - this.getPrice(b));
    } else if (this.sortBy === 'priceDesc') {
      this.filteredProperties.sort((a, b) => this.getPrice(b) - this.getPrice(a));
    } else if (this.sortBy === 'featured') {
      this.filteredProperties.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    // Tri secondaire par date
    if (this.sortStatus === 'recent') {
      this.filteredProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortStatus === 'old') {
      this.filteredProperties.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    this.updatePaginatedProperties();
  }

  updatePaginatedProperties(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProperties = this.filteredProperties.slice(start, end);
    this.loadOwners();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedProperties();
  }

  getImageUrl(media: any[]): string {
    if (media && media.length > 0) {
      return 'http://localhost:3000' + media[0].url;
    }
    return 'assets/images/default-property.jpg';
  }

  getTitle(): string {
    return this.city ? `Propriétés à ${this.city}` : 'Propriétés par ville';
  }

  // Méthode utilitaire pour obtenir la première image
  getFirstImage(property: Property): string {
    const img = property.media?.find(m => m.type === 'image');
    return img ? img.url : 'assets/images/default-property.jpg';
  }

  // Méthode utilitaire pour obtenir le prix
  getPrice(property: Property): number {
    return property.pricing?.price || 0;
  }

  // Méthode utilitaire pour obtenir la surface
  getArea(property: Property): number {
    return property.size?.total || 0;
  }

  // Méthode utilitaire pour obtenir le nombre de garages
  getGarages(property: Property): number {
    return property.parking?.spaces || 0;
  }

  // Méthode utilitaire pour obtenir le statut affiché
  getStatus(property: Property): string {
    if (property.listingType === 'rent') return 'For Rent';
    if (property.listingType === 'sale') return 'For Sale';
    if (property.listingType === 'both') return 'For Rent/Sale';
    return property.status;
  }

  loadOwners(): void {
    const ownerIds = Array.from(new Set(this.paginatedProperties.map(p => p.owner)));
    ownerIds.forEach(ownerId => {
      if (ownerId && !this.owners[ownerId]) {
        this.userService.getUser(ownerId).subscribe({
          next: (user: User) => {
            this.owners[ownerId] = user;
          },
          error: () => {
            // fallback: do nothing, will use default image and 'Unknown'
          }
        });
      }
    });
  }

  getOwnerName(ownerId: string): string {
    const owner = this.owners[ownerId];
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown';
  }

  getOwnerImage(ownerId: string): string {
    const owner = this.owners[ownerId];
    return owner && owner.profileImage ? 'http://localhost:3000' + owner.profileImage : 'assets/images/property/owner.webp';
  }

  // Method to get property URL with slug
  getPropertyUrl(property: Property): string {
    return PropertyService.getPropertyUrl(property);
  }

  // Method to create slug from property title
  createSlug(title: string): string {
    return PropertyService.createSlug(title);
  }

  // Method to navigate to property details page
  navigateToProperty(property: Property): void {
    const url = this.getPropertyUrl(property);
    this.router.navigate([url]);
  }

  createSearchForm(): FormGroup {
    return this.fb.group({
      keyword: [''],
      propertyType: [''],
      status: [''],
      location: [''],
      minPrice: [null],
      maxPrice: [null],
      amenities: this.fb.array([]),
      bathrooms: [''],
      bedrooms: [''],
      garages: [''],
      yearBuilt: [''],
      minArea: [''],
      maxArea: ['']
    });
  }

  onAmenityChange(amenity: string, event: any): void {
    const amenitiesArray = this.searchForm.get('amenities') as FormArray;
    if (event.target.checked) {
      amenitiesArray.push(this.fb.control(amenity));
    } else {
      const index = amenitiesArray.controls.findIndex(control => control.value === amenity);
      if (index >= 0) {
        amenitiesArray.removeAt(index);
      }
    }
  }

  isAmenitySelected(amenity: string): boolean {
    const amenitiesArray = this.searchForm.get('amenities') as FormArray;
    return amenitiesArray.controls.some(control => control.value === amenity);
  }

  // ENHANCED SEARCH METHOD - This is the key method that gets called from the HTML form
  onSearch(): void {
    console.log('=== SEARCH TRIGGERED ===');
    console.log('Search button clicked!');
    
    // Prevent default form submission
    event?.preventDefault();
    
    // Get current form values
    const formValue = this.searchForm.value;
    console.log('Current form values:', formValue);
    console.log('Form valid:', this.searchForm.valid);
    
    // Apply the enhanced search filters
    this.applyEnhancedSearch(formValue);
  }

  // Enhanced search method that filters based on form criteria
  applyEnhancedSearch(formValue: any): void {
    console.log('=== APPLYING ENHANCED SEARCH ===');
    console.log('Form data received:', formValue);
    
    try {
      // Start with all properties and filter by city first
      let filtered = this.properties.filter(p => {
        if (!p.address?.city || p.address.city.toLowerCase() !== this.city.toLowerCase()) {
          return false;
        }
        return true;
      });
      
      console.log(`Properties in ${this.city}:`, filtered.length);

      // Apply each filter criterion
      if (formValue.keyword && formValue.keyword.trim()) {
        console.log('Applying keyword filter:', formValue.keyword);
        filtered = filtered.filter(p => 
          p.title?.toLowerCase().includes(formValue.keyword.toLowerCase()) ||
          p.description?.toLowerCase().includes(formValue.keyword.toLowerCase())
        );
        console.log('After keyword filter:', filtered.length);
      }

      if (formValue.location && formValue.location.trim()) {
        console.log('Applying location filter:', formValue.location);
        filtered = filtered.filter(p => 
          p.address?.street?.toLowerCase().includes(formValue.location.toLowerCase()) ||
          p.address?.city?.toLowerCase().includes(formValue.location.toLowerCase()) ||
          p.address?.postalCode?.toLowerCase().includes(formValue.location.toLowerCase())
        );
        console.log('After location filter:', filtered.length);
      }

      if (formValue.status) {
        console.log('Applying status filter:', formValue.status);
        filtered = filtered.filter(p => this.getStatus(p) === formValue.status);
        console.log('After status filter:', filtered.length);
      }

      if (formValue.propertyType) {
        console.log('Applying property type filter:', formValue.propertyType);
        filtered = filtered.filter(p => p.type === formValue.propertyType);
        console.log('After property type filter:', filtered.length);
      }

      if (formValue.bathrooms) {
        console.log('Applying bathrooms filter:', formValue.bathrooms);
        filtered = filtered.filter(p => p.bathrooms === +formValue.bathrooms);
        console.log('After bathrooms filter:', filtered.length);
      }

      if (formValue.bedrooms) {
        console.log('Applying bedrooms filter:', formValue.bedrooms);
        filtered = filtered.filter(p => p.bedrooms === +formValue.bedrooms);
        console.log('After bedrooms filter:', filtered.length);
      }

      if (formValue.garages) {
        console.log('Applying garages filter:', formValue.garages);
        filtered = filtered.filter(p => {
          const garageCount = this.getGarages(p);
          if (formValue.garages === 'Yes') return garageCount > 0;
          if (formValue.garages === 'No') return garageCount === 0;
          return true; // 'Others' case
        });
        console.log('After garages filter:', filtered.length);
      }

      if (formValue.yearBuilt) {
        console.log('Applying year built filter:', formValue.yearBuilt);
        filtered = filtered.filter(p => p.yearBuilt === +formValue.yearBuilt);
        console.log('After year built filter:', filtered.length);
      }

      if (formValue.minArea) {
        console.log('Applying min area filter:', formValue.minArea);
        filtered = filtered.filter(p => this.getArea(p) >= +formValue.minArea);
        console.log('After min area filter:', filtered.length);
      }

      if (formValue.maxArea) {
        console.log('Applying max area filter:', formValue.maxArea);
        filtered = filtered.filter(p => this.getArea(p) <= +formValue.maxArea);
        console.log('After max area filter:', filtered.length);
      }

      // Price filters - Updated structure
      if (formValue.minPrice) {
        console.log('Applying min price filter:', formValue.minPrice);
        filtered = filtered.filter(p => this.getPrice(p) >= +formValue.minPrice);
        console.log('After min price filter:', filtered.length);
      }
      
      if (formValue.maxPrice) {
        console.log('Applying max price filter:', formValue.maxPrice);
        filtered = filtered.filter(p => this.getPrice(p) <= +formValue.maxPrice);
        console.log('After max price filter:', filtered.length);
      }

      // Amenities filter
      if (formValue.amenities && formValue.amenities.length > 0) {
        console.log('Applying amenities filter:', formValue.amenities);
        filtered = filtered.filter(p => {
          if (!p.amenities) return false;
          return formValue.amenities.every((amenity: string) => 
            p.amenities.includes(amenity as any)
          );
        });
        console.log('After amenities filter:', filtered.length);
      }

      // Update the filtered properties
      this.filteredProperties = filtered;
      this.totalResults = this.filteredProperties.length;
      this.totalPages = Math.ceil(this.totalResults / this.pageSize) || 1;
      this.currentPage = 1;

      console.log('=== SEARCH COMPLETE ===');
      console.log('Final filtered properties:', this.filteredProperties.length);
      console.log('Properties:', this.filteredProperties.map(p => p.title));

      // Apply sorting and update pagination
      this.applySort();
      this.updatePaginatedProperties();

    } catch (error) {
      console.error('Error in enhanced search:', error);
    }
  }

  // Method to reset search and show all properties in the city
  resetSearch(): void {
    console.log('Resetting search...');
    
    // Reset the form
    this.searchForm.reset();
    
    // Reset selectpickers using the same approach as property-form
    setTimeout(() => {
      $('.selectpicker').each((index: number, element: HTMLElement) => {
        $(element).selectpicker('val', '');
        $(element).selectpicker('refresh');
      });
      
      // Reset price slider if it exists
      if (($('.slider-range') as any).slider('instance')) {
        ($('.slider-range') as any).slider('values', [0, 1000000]);
        $('.amount').val('$0');
        $('.amount2').val('$1000000');
      }
    }, 100);
    
    // Show all properties in the city
    this.applyFilters();
  }

  // Method to handle form submission from HTML
  onSubmit(event: Event): void {
    event.preventDefault();
    console.log('Form submitted via onSubmit');
    this.onSearch();
  }

  // Add the missing mobile filter initialization method with correct responsive handling
  private initMobileFilter(): void {
  console.log('Initializing mobile filter...');
  
  // Show filter button click handler
  $('#open2, .filter_open_btn').on('click', (e: any) => {
    e.preventDefault();
    const sidebar = $('.listing_sidebar.dn.db-991');
    sidebar.addClass('active');
    $('body').addClass('modal-open');
    
    // Debug logging
    console.log('Show filter clicked - sidebar should now be visible');
    console.log('Sidebar classes after adding active:', sidebar[0]?.className);
    
    // Check computed styles
    setTimeout(() => {
      const sidebarEl = sidebar[0];
      if (sidebarEl) {
        const computedStyle = window.getComputedStyle(sidebarEl);
        console.log('=== COMPUTED STYLES AFTER ADDING ACTIVE ===');
        console.log('Display:', computedStyle.display);
        console.log('Position:', computedStyle.position);
        console.log('Z-index:', computedStyle.zIndex);
        console.log('Top:', computedStyle.top);
        console.log('Left:', computedStyle.left);
        console.log('Width:', computedStyle.width);
        console.log('Height:', computedStyle.height);
        console.log('Background:', computedStyle.background);
        console.log('Visibility:', computedStyle.visibility);
        console.log('Opacity:', computedStyle.opacity);
        console.log('Transform:', computedStyle.transform);
      }
    }, 100);
  });

  // Hide filter button click handler
  $('.closebtn, .filter_closed_btn').on('click', (e: any) => {
    e.preventDefault();
    $('.listing_sidebar.dn.db-991').removeClass('active');
    $('body').removeClass('modal-open');
    console.log('Hide filter clicked');
  });
  
  // Close when clicking outside
  $(document).on('click', (e: any) => {
    if (!$(e.target).closest('.listing_sidebar, .filter_open_btn, #open2').length) {
      $('.listing_sidebar.dn.db-991').removeClass('active');
      $('body').removeClass('modal-open');
    }
  });
}

  // Add this diagnostic method
  private debugMobileFilter(): void {
    console.log('=== MOBILE FILTER DEBUG ===');
    
    // Check for show filter button
    const showBtn = $('#open2');
    console.log('Show button (#open2):', showBtn.length);
    if (showBtn.length > 0) {
      console.log('Show button HTML:', showBtn[0].outerHTML);
      console.log('Show button visible:', showBtn.is(':visible'));
    }
    
    // Check for alternative show button
    const showBtnAlt = $('.filter_open_btn');
    console.log('Alt show button (.filter_open_btn):', showBtnAlt.length);
    if (showBtnAlt.length > 0) {
      console.log('Alt show button HTML:', showBtnAlt[0].outerHTML);
    }
    
    // Check for sidebar with correct selector
    const sidebar = $('.listing_sidebar.dn.db-991');
    console.log('Mobile sidebar (.listing_sidebar.dn.db-991):', sidebar.length);
    if (sidebar.length > 0) {
      console.log('Sidebar classes:', sidebar.attr('class'));
      console.log('Sidebar visible:', sidebar.is(':visible'));
      console.log('Sidebar display:', sidebar.css('display'));
      console.log('Sidebar HTML preview:', sidebar[0].outerHTML.substring(0, 200) + '...');
    }
    
    // Check for close buttons
    const closeBtn = $('.closebtn');
    console.log('Close button (.closebtn):', closeBtn.length);
    
    const filterCloseBtn = $('.filter_closed_btn');
    console.log('Filter close button (.filter_closed_btn):', filterCloseBtn.length);
  }
}