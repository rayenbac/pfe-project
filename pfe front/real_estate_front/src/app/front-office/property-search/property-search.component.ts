import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
import { NaturalLanguageSearchComponent } from '../../shared/components/natural-language-search/natural-language-search.component';

@Component({
  selector: 'app-property-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NaturalLanguageSearchComponent],
  templateUrl: './property-search.component.html',
  styleUrls: ['./property-search.component.css']
})
export class PropertySearchComponent implements OnInit {
  searchForm: FormGroup;
  advancedSearchVisible = false;
  properties: Property[] = [];
  loading = false;
  searchPerformed = false;
  activeTab = 'buy'; // Default tab
  priceRange = { min: 52000, max: 130000 };
  amenities: string[] = [
    'Air Conditioning', 'Lawn', 'Swimming Pool', 'Barbeque', 'Microwave', 'TV Cable',
    'Dryer', 'Outdoor Shower', 'Washer', 'Gym', 'Refrigerator', 'WiFi',
    'Laundry', 'Sauna', 'Window Coverings'
  ];
  propertyTypes = [
    'Apartment', 'Bungalow', 'Condo', 'House', 'Land', 'Single Family', 'Villa', 'Studio', 'Penthouse', 'Duplex', 'Townhouse'
  ];
  years = Array.from({ length: 11 }, (_, i) => 2013 + i);
  bathrooms = Array.from({ length: 8 }, (_, i) => i + 1);
  bedrooms = Array.from({ length: 8 }, (_, i) => i + 1);

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    // Initialize any sliders or other components
    this.initPriceSlider();
  }

  createSearchForm(): FormGroup {
    return this.fb.group({
      listingType: ['sale'], // 'sale' or 'rent'
      keyword: [''],
      propertyType: [''],
      location: [''],
      price: this.fb.group({
        min: [this.priceRange.min],
        max: [this.priceRange.max]
      }),
      amenities: this.fb.array([]),
      bathrooms: [''],
      bedrooms: [''],
      yearBuilt: [''],
      builtUpArea: ['']
    });
  }

  initPriceSlider(): void {
    // This would normally initialize a price slider
    // For now, we'll just set the initial values
    const priceControl = this.searchForm.get('price');
    if (priceControl) {
      priceControl.setValue({
        min: this.priceRange.min,
        max: this.priceRange.max
      });
    }
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.searchForm.patchValue({
      listingType: tab === 'buy' ? 'sale' : 'rent'
    });
  }

  toggleAdvancedSearch(): void {
    this.advancedSearchVisible = !this.advancedSearchVisible;
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

  onPriceChange(event: any): void {
    // This would be called when the price slider changes
    // For now, we'll just update the form values
    const priceControl = this.searchForm.get('price');
    if (priceControl) {
      priceControl.setValue({
        min: event.min || this.priceRange.min,
        max: event.max || this.priceRange.max
      });
    }
  }

  onSearch(): void {
    this.loading = true;
    this.searchPerformed = true;
    
    // Prepare search criteria from the form
    const searchCriteria = this.prepareSearchCriteria();
    
    console.log('Search criteria:', searchCriteria);
    
    // Call the property service to search for properties
    this.propertyService.searchProperties(searchCriteria).subscribe({
      next: (results) => {
        this.properties = results;
        this.loading = false;
        
        console.log('Search results:', results);
        console.log('Number of results:', results.length);
        
        // Show success message
        this.showSearchFeedback('success', `Found ${results.length} properties matching your criteria.`);
      },
      error: (error) => {
        console.error('Error searching properties:', error);
        this.loading = false;
        this.properties = []; // Clear results on error
        
        // Show error message
        this.showSearchFeedback('error', 'Unable to search properties. Please try again.');
      }
    });
  }

  prepareSearchCriteria(): any {
    const formValue = this.searchForm.value;
    
    // Build the search criteria object
    const criteria: any = {
      listingType: formValue.listingType
    };

    if (formValue.keyword) criteria.keyword = formValue.keyword;
    if (formValue.propertyType) criteria.type = formValue.propertyType;
    if (formValue.location) criteria.location = formValue.location;
    
    if (formValue.price) {
      criteria.price = {
        min: formValue.price.min,
        max: formValue.price.max
      };
    }
    
    if (formValue.amenities && formValue.amenities.length > 0) {
      criteria.amenities = formValue.amenities;
    }
    
    if (formValue.bathrooms) criteria.bathrooms = formValue.bathrooms;
    if (formValue.bedrooms) criteria.bedrooms = formValue.bedrooms;
    if (formValue.yearBuilt) criteria.yearBuilt = formValue.yearBuilt;
    if (formValue.builtUpArea) criteria.builtUpArea = formValue.builtUpArea;
    
    return criteria;
  }

  getImageUrl(property: Property): string {
    if (property.media && property.media.length > 0) {
      return 'http://localhost:3000' + property.media[0].url;
    }
    return 'assets/images/property/fp1.jpg'; // Default image
  }

  formatPrice(price: number): string {
    return price ? '$' + price.toLocaleString() : 'N/A';
  }

  getPropertyStatusClass(status: string): string {
    switch (status) {
      case 'available':
        return 'sale';
      case 'sold':
        return 'sold';
      case 'rented':
        return 'rent';
      default:
        return '';
    }
  }

  goToPropertyDetails(property: Property): void {
    const slug = PropertyService.createSlug(property.title);
    this.router.navigate(['/property', slug]);
  }

  // Natural language search methods
  onNaturalLanguageSearch(criteria: any): void {
    console.log('Natural language search criteria received:', criteria);
    
    // Apply the NLP criteria to the search form
    this.applyNLPCriteria(criteria);
    
    // Perform the search
    this.performNLPSearch(criteria);
  }

  private applyNLPCriteria(criteria: any): void {
    // Update form with NLP criteria
    const formUpdates: any = {};
    
    if (criteria.propertyType) {
      formUpdates.propertyType = criteria.propertyType;
    }
    
    if (criteria.location) {
      formUpdates.location = criteria.location;
    }
    
    if (criteria.listingType) {
      formUpdates.listingType = criteria.listingType;
      this.activeTab = criteria.listingType === 'rent' ? 'rent' : 'buy';
    }
    
    if (criteria.bedrooms) {
      formUpdates.bedrooms = criteria.bedrooms.toString();
    }
    
    if (criteria.bathrooms) {
      formUpdates.bathrooms = criteria.bathrooms.toString();
    }
    
    if (criteria.yearBuilt) {
      formUpdates.yearBuilt = criteria.yearBuilt.toString();
    }
    
    // Update price range
    if (criteria.minPrice || criteria.maxPrice) {
      const currentPrice = this.searchForm.get('price')?.value || {};
      formUpdates.price = {
        min: criteria.minPrice || currentPrice.min || this.priceRange.min,
        max: criteria.maxPrice || currentPrice.max || this.priceRange.max
      };
    }
    
    // Update amenities
    if (criteria.amenities && criteria.amenities.length > 0) {
      const amenitiesArray = this.searchForm.get('amenities') as FormArray;
      amenitiesArray.clear();
      
      criteria.amenities.forEach((amenity: string) => {
        // Map common amenities to our available ones
        const mappedAmenity = this.mapAmenity(amenity);
        if (mappedAmenity && this.amenities.includes(mappedAmenity)) {
          amenitiesArray.push(this.fb.control(mappedAmenity));
        }
      });
    }
    
    // Apply updates to form
    this.searchForm.patchValue(formUpdates);
  }

  private mapAmenity(nlpAmenity: string): string {
    const amenityMap: { [key: string]: string } = {
      'pool': 'Swimming Pool',
      'swimming pool': 'Swimming Pool',
      'gym': 'Gym',
      'parking': 'Parking',
      'garden': 'Lawn',
      'yard': 'Lawn',
      'beachfront': 'Beachfront',
      'beach': 'Beachfront',
      'air conditioning': 'Air Conditioning',
      'ac': 'Air Conditioning',
      'wifi': 'WiFi',
      'internet': 'WiFi',
      'laundry': 'Laundry',
      'washer': 'Washer',
      'dryer': 'Dryer',
      'balcony': 'Balcony',
      'terrace': 'Terrace',
      'elevator': 'Elevator'
    };
    
    return amenityMap[nlpAmenity.toLowerCase()] || nlpAmenity;
  }

  private performNLPSearch(criteria: any): void {
    this.loading = true;
    this.searchPerformed = true;
    
    // Use the existing search method but with NLP-enhanced criteria
    const enhancedCriteria = { ...this.prepareSearchCriteria(), ...criteria };
    
    // Map propertyType to type for consistency with the filter
    if (criteria.propertyType) {
      enhancedCriteria.type = criteria.propertyType;
    }
    
    console.log('Performing NLP-enhanced search with criteria:', enhancedCriteria);
    
    this.propertyService.searchProperties(enhancedCriteria).subscribe({
      next: (results) => {
        this.properties = results;
        this.loading = false;
        console.log('NLP search results:', results);
        
        // Show success message
        this.showSearchFeedback('success', `Found ${results.length} properties matching your description.`);
      },
      error: (error) => {
        console.error('Error in NLP search:', error);
        this.loading = false;
        this.properties = [];
        this.showSearchFeedback('error', 'Unable to search properties. Please try again.');
      }
    });
  }

  onNaturalLanguageSearchError(error: string): void {
    console.error('Natural language search error:', error);
    this.showSearchFeedback('warning', error);
  }

  onNaturalLanguageSearchStarted(): void {
    console.log('Natural language search started');
  }

  onNaturalLanguageSearchCompleted(): void {
    console.log('Natural language search completed');
  }

  private showSearchFeedback(type: 'success' | 'error' | 'warning', message: string): void {
    // You can implement toast notifications or other feedback mechanisms here
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // For now, we'll just log to console
    // In production, you might want to use a toast service or similar
  }

  // Debug method to see all available properties
  debugShowAllProperties(): void {
    this.propertyService.getProperties().subscribe({
      next: (properties) => {
        console.log('=== ALL AVAILABLE PROPERTIES ===');
        console.log('Total properties:', properties.length);
        
        properties.forEach((property, index) => {
          console.log(`Property ${index + 1}:`, {
            title: property.title,
            type: property.type,
            listingType: property.listingType,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            pricing: property.pricing,
            address: property.address
          });
        });
        
        console.log('=== UNIQUE PROPERTY TYPES ===');
        const uniqueTypes = [...new Set(properties.map(p => p.type))];
        console.log('Available types:', uniqueTypes);
        
        console.log('=== UNIQUE LISTING TYPES ===');
        const uniqueListingTypes = [...new Set(properties.map(p => p.listingType))];
        console.log('Available listing types:', uniqueListingTypes);
      },
      error: (error) => {
        console.error('Error loading properties for debug:', error);
      }
    });
  }
}