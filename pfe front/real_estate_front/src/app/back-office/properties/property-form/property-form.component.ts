import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

// Add the interface for PropertyFeature
interface PropertyFeature {
  name: string;
  value: string | number | boolean;
  icon?: string;
}

interface PropertyAmenity {
  category: string;
  name: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.css']
})
export class PropertyFormComponent implements OnInit {
  @ViewChild('featuresInput') featuresInput!: ElementRef;  
  propertyForm: FormGroup;
  isEditMode = false;
  propertyId: string | null = null;
  uploadedImages: { url: string; name: string; file?: File; isExisting: boolean }[] = [];
  selectedFiles: File[] = [];
  featuresList: PropertyFeature[] = []; // Changed to PropertyFeature[]
  amenitiesList: PropertyAmenity[] = []; // Added amenities list
  originalMedia: any[] = []; // Store original media data
  uploadedAttachments: { name: string; file: File }[] = [];
  private map: any = null;
  private marker: any = null;
  private mapsApiLoaded = false;

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required],
      status: ['', Validators.required], 
      listingType: ['', Validators.required],
    
      // Basic Details
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      halfBathrooms: ['', [Validators.required, Validators.min(0)]],
      size: this.fb.group({
        total: ['', [Validators.required, Validators.min(1)]],
        indoor: ['', [Validators.required, Validators.min(1)]],
        outdoor: ['', [Validators.required, Validators.min(0)]],
        unit: ['', Validators.required]
      }),
      yearBuilt: [''],
      parking: this.fb.group({
        type: ['', Validators.required],
        spaces: ['', [Validators.required, Validators.min(0)]]
      }),
      lotSize: this.fb.group({
        size: ['', [Validators.required, Validators.min(0)]],
        unit: ['', Validators.required]
      }),
      floors: ['', [Validators.required, Validators.min(1)]],
      unitNumber: [''],
    
      // Location
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        country: ['', Validators.required],
        postalCode: ['', Validators.required],
        latitude: [''],
        longitude: ['']
      }),
    
      // Financial
      pricing: this.fb.group({
        price: ['', [Validators.required, Validators.min(0)]],
        currency: ['', Validators.required],
        pricePerSquareFoot: [''],
        maintenanceFee: [''],
        propertyTax: [''],
      }),
    
      // Features & Amenities
      amenities: this.fb.array([]),
      features: this.fb.array([]), // This will hold our features
    
      // Media & Attachments
      media: this.fb.array([]),
      attachments: this.fb.array([]),
    
      virtualTour: this.fb.group({
        url: [''],
        provider: ['']
      }),
    
      // Additional Details
      constructionStatus: ['', Validators.required],
      furnishingStatus: ['', Validators.required],
      facing: [''],
      availability: this.fb.group({
        date: ['', Validators.required],
        status: ['', Validators.required]
      }),
    
      // Relationships
      owner: ['', Validators.required],
      listedBy: ['', Validators.required],
    
      // Metadata
      lastModifiedBy: ['', Validators.required],
      views: [0],
      favorites: [0],
      featured: [false],
      verified: [false],
      certifications: this.fb.array([]),
      tags: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.propertyId = this.route.snapshot.paramMap.get('id');
    if (this.propertyId) {
      this.isEditMode = true;
      this.loadPropertyData();
    } else {
      const loggedInUserId = '67bdd5eb492179aaecb6f8f8'; 
      this.propertyForm.patchValue({
        owner: loggedInUserId,
        listedBy: loggedInUserId,
        lastModifiedBy: loggedInUserId
      });
    }
    
    // Set up event handler for features input after the view is initialized
    setTimeout(() => {
      this.setupFeaturesInputEvent();
    });
    this.loadGoogleMapsScript();
  }
  
  // Setup event listener for the features input
  setupFeaturesInputEvent(): void {
    const inputElement = document.getElementById('featuresInput') as HTMLInputElement;
    if (inputElement) {
      inputElement.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          this.addFeatureFromInput();
        }
      });
      
      // Also handle blur event to add feature when input loses focus
      inputElement.addEventListener('blur', () => {
        this.addFeatureFromInput();
      });
    }
  }
  
  // Add feature from input field
  addFeatureFromInput(): void {
    const inputElement = document.getElementById('featuresInput') as HTMLInputElement;
    if (inputElement && inputElement.value.trim()) {
      const featureName = inputElement.value.trim().replace(/,/g, ''); // Remove any commas
      
      // Check if this feature name already exists
      if (featureName && !this.featuresList.some(f => f.name === featureName)) {
        this.addFeature({
          name: featureName,
          value: true // Default value is true to indicate presence
        });
        inputElement.value = ''; // Clear the input
      }
    }
  }
  
  // Add a feature to the form array and update UI
  addFeature(feature: PropertyFeature): void {
    if (feature && !this.featuresList.some(f => f.name === feature.name)) {
      this.featuresList.push(feature);
      
      // Add to form array
      const featuresArray = this.propertyForm.get('features') as FormArray;
      featuresArray.push(this.fb.group({
        name: [feature.name, Validators.required],
        value: [feature.value],
        icon: [feature.icon || '']
      }));
      
      // Update UI tags
      this.updateFeaturesTags();
    }
  }
  
  // Remove a feature
  removeFeature(index: number): void {
    this.featuresList.splice(index, 1);
    
    // Remove from form array
    const featuresArray = this.propertyForm.get('features') as FormArray;
    featuresArray.removeAt(index);
    
    // Update UI tags
    this.updateFeaturesTags();
  }
  
  // Update the features tags in the UI
  updateFeaturesTags(): void {
    const tagsContainer = document.getElementById('featuresTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      
      this.featuresList.forEach((feature, index) => {
        const tagElement = document.createElement('span');
        tagElement.className = 'badge bg-primary me-2 mb-2 p-2';
        tagElement.textContent = feature.name; // Use feature.name instead of the whole feature
        
        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'btn-close btn-close-white ms-2';
        removeButton.setAttribute('aria-label', 'Remove');
        removeButton.style.fontSize = '0.65rem';
        removeButton.onclick = () => this.removeFeature(index);
        
        tagElement.appendChild(removeButton);
        tagsContainer.appendChild(tagElement);
      });
    }
  }

  // Add amenity to the form
  addAmenity(category: string, name: string, description: string = '', icon: string = ''): void {
    const amenity: PropertyAmenity = {
      category,
      name,
      description,
      icon
    };
    
    this.amenitiesList.push(amenity);
    
    const amenitiesArray = this.propertyForm.get('amenities') as FormArray;
    amenitiesArray.push(this.fb.group({
      category: [amenity.category],
      name: [amenity.name],
      description: [amenity.description],
      icon: [amenity.icon]
    }));
  }

  // Toggle amenity selection
  toggleAmenity(event: Event, category: string, name: string): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.addAmenity(category, name);
    } else {
      // Find and remove the amenity
      const index = this.amenitiesList.findIndex(a => a.category === category && a.name === name);
      if (index !== -1) {
        this.amenitiesList.splice(index, 1);
        const amenitiesArray = this.propertyForm.get('amenities') as FormArray;
        amenitiesArray.removeAt(index);
      }
    }
  }

  // Check if an amenity is selected
  isAmenitySelected(category: string, name: string): boolean {
    return this.amenitiesList.some(a => a.category === category && a.name === name);
  }

  get mediaControls() {
    return (this.propertyForm.get('media') as FormArray).controls;
  }
  
  get featuresControls() {
    return (this.propertyForm.get('features') as FormArray).controls;
  }
  
  addMedia() {
    const mediaControl = new FormControl('');
    (this.propertyForm.get('media') as FormArray).push(mediaControl);
  }
  
  removeMedia(index: number) {
    (this.propertyForm.get('media') as FormArray).removeAt(index);
  }

  get priceHistoryControls() {
    return this.propertyForm.get('priceHistory') as FormArray;
  }
  
  addPriceHistory() {
    this.priceHistoryControls.push(
      this.fb.group({
        date: ['', Validators.required],
        price: ['', [Validators.required, Validators.min(0)]]
      })
    );
  }
  
  removePriceHistory(index: number) {
    this.priceHistoryControls.removeAt(index);
  }
  
  get attachmentControls() {
    return (this.propertyForm.get('attachments') as FormArray).controls;
  }

  onFileChange(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array and store new files
    const newFiles = Array.from(files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    
    // Get the current media array
    const mediaArray = this.propertyForm.get('media') as FormArray;
    
    // Process new files and add them to uploadedImages and media array
    newFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Add to uploadedImages for preview
        this.uploadedImages.push({ 
          url: e.target.result, 
          name: file.name,
          file: file,
          isExisting: false
        });
        
        // Add to media form array
        mediaArray.push(this.fb.group({
          type: ['image'],
          url: [''], // Will be set by server
          thumbnail: [file.name],
          title: [file.name],
          description: ['Property image'],
          isPrimary: [mediaArray.length === 0], // First image is primary
          order: [mediaArray.length + 1]
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  deleteImage(index: number) {
    const deletedImage = this.uploadedImages[index];
    
    // Remove from uploadedImages array
    this.uploadedImages.splice(index, 1);
    
    // If it's a new image (has file property), remove from selectedFiles
    if (!deletedImage.isExisting) {
      this.selectedFiles = this.selectedFiles.filter(file => 
        file.name !== deletedImage.file?.name
      );
    }
    
    // Remove from media form array
    const mediaArray = this.propertyForm.get('media') as FormArray;
    if (mediaArray.length > index) {
      mediaArray.removeAt(index);
      
      // Update order and isPrimary for remaining items
      mediaArray.controls.forEach((control, i) => {
        control.patchValue({
          order: i + 1,
          isPrimary: i === 0
        });
      });
    }
  }

  onAttachmentChange(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    // Convert FileList to Array and store new files
    const newFiles = Array.from(files) as File[];
    newFiles.forEach(file => {
      // Prevent duplicates
      if (!this.uploadedAttachments.some(att => att.name === file.name)) {
        this.uploadedAttachments.push({ name: file.name, file });
      }
    });
  }

  deleteAttachment(index: number) {
    this.uploadedAttachments.splice(index, 1);
  }

  loadPropertyData(): void {
    if (this.propertyId) {
      this.propertyService.getProperty(this.propertyId).subscribe(
        (property) => {
          console.log('Loaded property data:', property);
          
          // Clear existing form arrays
          this.clearFormArrays();
          
          // Store original media for comparison later
          if (property.media && Array.isArray(property.media)) {
            this.originalMedia = [...property.media];
          }
          
          // Patch basic form values
          this.propertyForm.patchValue(property);
          
          // Handle features array
          if (property.features && Array.isArray(property.features)) {
            this.featuresList = [...property.features];
            
            const featuresArray = this.propertyForm.get('features') as FormArray;
            property.features.forEach(feature => {
              featuresArray.push(this.fb.group({
                name: [feature.name, Validators.required],
                value: [feature.value],
                icon: [feature.icon || '']
              }));
            });
            
            setTimeout(() => {
              this.updateFeaturesTags();
            });
          }
          
          // Handle amenities array
          if (property.amenities && Array.isArray(property.amenities)) {
            this.amenitiesList = [...property.amenities];
            
            const amenitiesArray = this.propertyForm.get('amenities') as FormArray;
            property.amenities.forEach(amenity => {
              amenitiesArray.push(this.fb.group({
                category: [amenity.category],
                name: [amenity.name],
                description: [amenity.description || ''],
                icon: [amenity.icon || '']
              }));
            });
          }
          
          // Handle media array
          if (property.media && Array.isArray(property.media)) {
            const mediaArray = this.propertyForm.get('media') as FormArray;
            
            // Add each media item as a form group and update UI preview
            property.media.forEach((media, index) => {
              mediaArray.push(this.fb.group({
                type: [media.type || 'image'],
                url: [media.url],
                thumbnail: [media.thumbnail || ''],
                title: [media.title || ''],
                description: [media.description || ''],
                isPrimary: [media.isPrimary || false],
                order: [media.order || index + 1]
              }));
              
              // Update the UI preview with existing images
              if (media.url) {
                this.uploadedImages.push({
                  url: 'http://localhost:3000' + media.url,
                  name: media.title || `Image ${index + 1}`,
                  isExisting: true
                });
              }
            });
          }

          // Handle attachments array if needed
          if (property.attachments && Array.isArray(property.attachments)) {
            const attachmentsArray = this.propertyForm.get('attachments') as FormArray;
            property.attachments.forEach(attachment => {
              attachmentsArray.push(this.fb.control(attachment.url || ''));
            });
          }
        },
        (error) => {
          console.error('Error loading property:', error);
          this.showErrorAlert('Error loading property data');
        } 
      );
    } 
  }

  clearFormArrays(): void {
    const featuresArray = this.propertyForm.get('features') as FormArray;
    const amenitiesArray = this.propertyForm.get('amenities') as FormArray;
    const mediaArray = this.propertyForm.get('media') as FormArray;
    const attachmentsArray = this.propertyForm.get('attachments') as FormArray;
    
    while (featuresArray.length) {
      featuresArray.removeAt(0);
    }
    
    while (amenitiesArray.length) {
      amenitiesArray.removeAt(0);
    }
    
    while (mediaArray.length) {
      mediaArray.removeAt(0);
    }
    
    while (attachmentsArray.length) {
      attachmentsArray.removeAt(0);
    }
    
    this.featuresList = [];
    this.amenitiesList = [];
    this.uploadedImages = [];
    this.selectedFiles = [];
  }

  onSubmit(): void {
    console.log('Submit button clicked');
  
    if (this.propertyForm.valid) {
      console.log('Form is valid');
      
      // Ensure features from UI are in the form
      this.syncFeaturesWithForm();
      
      // Create FormData object for file uploads
      const formData = new FormData();
      
      // Get form values
      const propertyData = this.propertyForm.value;
      
      // Convert numeric fields to numbers
      propertyData.bedrooms = +propertyData.bedrooms;
      propertyData.bathrooms = +propertyData.bathrooms;
      propertyData.halfBathrooms = +propertyData.halfBathrooms;
      propertyData.yearBuilt = +propertyData.yearBuilt;
      
      // Convert nested numeric fields
      propertyData.parking.spaces = +propertyData.parking.spaces;
      propertyData.lotSize.size = +propertyData.lotSize.size || 0;
      propertyData.pricing.price = +propertyData.pricing.price;
      
      // For nested objects, append each property individually with dot notation
      // Size object
      formData.append('size[total]', propertyData.size.total.toString());
      formData.append('size[indoor]', propertyData.size.indoor.toString());
      formData.append('size[outdoor]', propertyData.size.outdoor.toString());
      formData.append('size[unit]', propertyData.size.unit);
      
      // Parking object
      formData.append('parking[type]', propertyData.parking.type);
      formData.append('parking[spaces]', propertyData.parking.spaces.toString());
      
      // Lot size object
      formData.append('lotSize[size]', propertyData.lotSize.size.toString());
      formData.append('lotSize[unit]', propertyData.lotSize.unit);
      
      // Address object
      formData.append('address[street]', propertyData.address.street);
      formData.append('address[city]', propertyData.address.city);
      formData.append('address[state]', propertyData.address.state);
      formData.append('address[country]', propertyData.address.country);
      formData.append('address[postalCode]', propertyData.address.postalCode);
      if (propertyData.address.latitude) formData.append('address[latitude]', propertyData.address.latitude.toString());
      if (propertyData.address.longitude) formData.append('address[longitude]', propertyData.address.longitude.toString());
      
      // Pricing object
      formData.append('pricing[price]', propertyData.pricing.price.toString());
      formData.append('pricing[currency]', propertyData.pricing.currency);
      if (propertyData.pricing.pricePerSquareFoot) formData.append('pricing[pricePerSquareFoot]', propertyData.pricing.pricePerSquareFoot.toString());
      if (propertyData.pricing.maintenanceFee) formData.append('pricing[maintenanceFee]', propertyData.pricing.maintenanceFee.toString());
      if (propertyData.pricing.propertyTax) formData.append('pricing[propertyTax]', propertyData.pricing.propertyTax.toString());
      
      // Availability object
      formData.append('availability[date]', new Date(propertyData.availability.date).toISOString());
      formData.append('availability[status]', propertyData.availability.status);
      
      // Virtual tour object (if provided)
      if (propertyData.virtualTour && propertyData.virtualTour.url) {
        formData.append('virtualTour[url]', propertyData.virtualTour.url);
        if (propertyData.virtualTour.provider) formData.append('virtualTour[provider]', propertyData.virtualTour.provider);
      }
      
      // Add simple fields directly
      formData.append('title', propertyData.title);
      formData.append('description', propertyData.description);
      formData.append('type', propertyData.type);
      formData.append('status', propertyData.status);
      formData.append('listingType', propertyData.listingType);
      formData.append('bedrooms', propertyData.bedrooms.toString());
      formData.append('bathrooms', propertyData.bathrooms.toString());
      formData.append('halfBathrooms', propertyData.halfBathrooms.toString());
      formData.append('yearBuilt', propertyData.yearBuilt.toString());
      formData.append('floors', propertyData.floors.toString());
      formData.append('unitNumber', propertyData.unitNumber || '');
      formData.append('constructionStatus', propertyData.constructionStatus);
      formData.append('furnishingStatus', propertyData.furnishingStatus);
      formData.append('facing', propertyData.facing || '');
      formData.append('owner', propertyData.owner);
      formData.append('listedBy', propertyData.listedBy);
      formData.append('lastModifiedBy', propertyData.lastModifiedBy);
      
      // Handle array fields - append each array item individually
      if (propertyData.features && propertyData.features.length) {
        propertyData.features.forEach((feature: any, index: number) => {
          formData.append(`features[${index}][name]`, feature.name);
          formData.append(`features[${index}][value]`, feature.value.toString());
          if (feature.icon) formData.append(`features[${index}][icon]`, feature.icon);
        });
      }
      
      if (propertyData.amenities && propertyData.amenities.length) {
        propertyData.amenities.forEach((amenity: any, index: number) => {
          formData.append(`amenities[${index}][category]`, amenity.category);
          formData.append(`amenities[${index}][name]`, amenity.name);
          if (amenity.description) formData.append(`amenities[${index}][description]`, amenity.description);
          if (amenity.icon) formData.append(`amenities[${index}][icon]`, amenity.icon);
        });
      }
      
      // Handle tags array (if any)
      if (propertyData.tags && propertyData.tags.length) {
        propertyData.tags.forEach((tag: string, index: number) => {
          formData.append(`tags[${index}]`, tag);
        });
      }
      
      // Handle certifications array (if any)
      if (propertyData.certifications && propertyData.certifications.length) {
        propertyData.certifications.forEach((cert: string, index: number) => {
          formData.append(`certifications[${index}]`, cert);
        });
      }
      
      // Handle attachments
      if (this.uploadedAttachments.length > 0) {
        this.uploadedAttachments.forEach((att, index) => {
          formData.append('attachments', att.file, att.name);
        });
      }
      
      // Handle existing and new images
      if (this.isEditMode) {
        // Add existing images to formData
        const existingImages = this.uploadedImages.filter(img => img.isExisting);
        existingImages.forEach((image, index) => {
          formData.append(`media[${index}][type]`, 'image');
          formData.append(`media[${index}][url]`, image.url.replace('http://localhost:3000', ''));
          formData.append(`media[${index}][title]`, image.name);
          formData.append(`media[${index}][description]`, 'Property image');
          formData.append(`media[${index}][isPrimary]`, (index === 0).toString());
          formData.append(`media[${index}][order]`, (index + 1).toString());
        });
        
        // Add new images
        let existingImagesCount = existingImages.length;
        this.selectedFiles.forEach((file, index) => {
          formData.append('images', file, file.name);
          formData.append(`media[${index + existingImagesCount}][type]`, 'image');
          formData.append(`media[${index + existingImagesCount}][title]`, file.name);
          formData.append(`media[${index + existingImagesCount}][description]`, 'Property image');
          formData.append(`media[${index + existingImagesCount}][isPrimary]`, (index + existingImagesCount === 0).toString());
          formData.append(`media[${index + existingImagesCount}][order]`, (index + existingImagesCount + 1).toString());
        });

        // If no new images were added and no existing images were deleted, preserve original media
        if (this.selectedFiles.length === 0 && this.uploadedImages.length === 0) {
          // Add a flag to indicate we should keep existing media
          formData.append('preserveExistingMedia', 'true');
        }
      } else {
        // Handle new property creation (existing code)
        this.selectedFiles.forEach((file, index) => {
          formData.append('images', file, file.name);
          formData.append(`media[${index}][type]`, 'image');
          formData.append(`media[${index}][title]`, file.name);
          formData.append(`media[${index}][description]`, 'Property image');
          formData.append(`media[${index}][isPrimary]`, (index === 0).toString());
          formData.append(`media[${index}][order]`, (index + 1).toString());
        });
      }
      
      console.log('Form Data created with files:', this.selectedFiles.length);
  
      if (this.isEditMode && this.propertyId) {
        console.log('Updating property...');
        this.propertyService.updateProperty(this.propertyId, formData).subscribe(
          () => {
            console.log('Property updated successfully');
            this.showSuccessAlert('Property updated successfully');
            this.router.navigate(['/admin/properties']);
          },
          (error) => {
            console.error('Error updating property:', error);
            console.error('Server Error Response:', error.error);
            this.showErrorAlert('Error updating property: ' + (error.error?.message || error.message));
          }
        );
      } else {
        console.log('Creating new property...');
        this.propertyService.addProperty(formData).subscribe(
          () => {
            console.log('Property created successfully');
            this.showSuccessAlert('Property created successfully');
            this.router.navigate(['/admin/properties']);
          },
          (error) => {
            console.error('Error creating property:', error);
            console.error('Server Error Response:', error.error);
            this.showErrorAlert('Error creating property: ' + (error.error?.message || error.message));
          }
        );
      }
    } else {
      console.log('Form is invalid');
      console.log('Form Errors:', this.propertyForm.errors);
  
      // Log validation state of each control
      Object.keys(this.propertyForm.controls).forEach((key) => {
        const control = this.propertyForm.get(key);
        if (control?.invalid) {
          console.log(`Control "${key}" is invalid. Errors:`, control.errors);
        }
      });
    }
  }
  
  // Make sure the features in UI match what's in the form before submission
  syncFeaturesWithForm(): void {
    const featuresArray = this.propertyForm.get('features') as FormArray;
    
    // Clear the existing array
    while (featuresArray.length) {
      featuresArray.removeAt(0);
    }
    
    // Add all features from the UI list
    this.featuresList.forEach(feature => {
      featuresArray.push(this.fb.group({
        name: [feature.name, Validators.required],
        value: [feature.value],
        icon: [feature.icon || '']
      }));
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/properties']); // Navigate back to the properties list
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message
    });
  }

  private loadGoogleMapsScript(): void {
    if ((window as any).google && (window as any).google.maps) {
      this.mapsApiLoaded = true;
      setTimeout(() => this.initMap(), 0);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.mapsApiLoaded = true;
      this.initMap();
    };
    document.body.appendChild(script);
  }

  private initMap(): void {
    const mapElement = document.getElementById('property-location-map');
    if (!mapElement || !(window as any).google || !(window as any).google.maps) return;
    // Default location (center of the country or a fallback)
    const defaultLat = this.propertyForm.get('address.latitude')?.value || 36.8065;
    const defaultLng = this.propertyForm.get('address.longitude')?.value || 10.1815;
    const center = { lat: parseFloat(defaultLat) || 36.8065, lng: parseFloat(defaultLng) || 10.1815 };
    this.map = new (window as any).google.maps.Map(mapElement, {
      center,
      zoom: 13,
    });
    this.marker = new (window as any).google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true
    });
    // Update form when marker is dragged
    this.marker.addListener('dragend', (event: any) => {
      this.setLatLng(event.latLng.lat(), event.latLng.lng());
    });
    // Update marker and form when map is clicked
    this.map.addListener('click', (event: any) => {
      this.setLatLng(event.latLng.lat(), event.latLng.lng());
      this.marker?.setPosition(event.latLng);
    });
    // If form already has lat/lng, set marker
    if (this.propertyForm.get('address.latitude')?.value && this.propertyForm.get('address.longitude')?.value) {
      this.setLatLng(
        parseFloat(this.propertyForm.get('address.latitude')?.value),
        parseFloat(this.propertyForm.get('address.longitude')?.value)
      );
    }
  }

  private setLatLng(lat: number, lng: number): void {
    this.propertyForm.get('address.latitude')?.setValue(lat);
    this.propertyForm.get('address.longitude')?.setValue(lng);
  }
}