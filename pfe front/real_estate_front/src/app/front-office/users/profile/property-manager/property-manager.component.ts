import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PropertyService } from '../../../../core/services/property.service';
import { Property, CreatePropertyRequest } from '../../../../core/models/property.model'; // Updated Property interface

@Component({
  selector: 'app-property-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './property-manager.component.html',
  styleUrls: ['./property-manager.component.css']
})
export class PropertyManagerComponent implements OnInit {
  properties: Property[] = [];
  propertyForm: FormGroup;
  loading = false;
  saving = false;
  showModal = false;
  editingProperty: Property | null = null;
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  propertyTypes = [
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'HOUSE', label: 'House' },
    { value: 'CONDO', label: 'Condo' },
    { value: 'VILLA', label: 'Villa' }
  ];

  statusTypes = [
    { value: 'AVAILABLE', label: 'Available', class: 'success' },
    { value: 'RENTED', label: 'Rented', class: 'warning' },
    { value: 'SOLD', label: 'Sold', class: 'info' },
    { value: 'PENDING', label: 'Pending', class: 'secondary' }
  ];

  amenitiesList = [
    'Air Conditioning', 'Heating', 'WiFi', 'Parking', 'Pool', 'Gym', 
    'Laundry', 'Dishwasher', 'Microwave', 'Balcony', 'Garden', 'Elevator'
  ];

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService
  ) {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: ['', [Validators.required, Validators.min(0)]],
      type: ['', [Validators.required]],
      bedrooms: ['', [Validators.required, Validators.min(0)]],
      bathrooms: ['', [Validators.required, Validators.min(0)]],
      area: ['', [Validators.required, Validators.min(1)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      amenities: [[]]
    });
  }

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getAgentProperties().subscribe({
      next: (properties: Property[]) => {
        this.properties = properties;
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load properties', 'error');
        this.loading = false;
      }
    });
  }

  openModal(property?: Property): void {
    this.editingProperty = property || null;
    this.selectedImages = [];
    this.imagePreviewUrls = [];
    
    if (property) {
      this.propertyForm.patchValue({
        title: property.title,
        description: property.description,
        price: property.pricing.price,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.size.total,
        address: property.address.street,
        city: property.address.city,
        state: property.address.state,
        zipCode: property.address.postalCode,
        amenities: property.amenities?.map(a => a.name) || []
      });
      this.imagePreviewUrls = property.media?.filter(m => m.type === 'image').map(m => m.url) || [];
    } else {
      this.propertyForm.reset();
      this.propertyForm.patchValue({ amenities: [] });
    }
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProperty = null;
    this.propertyForm.reset();
    this.selectedImages = [];
    this.imagePreviewUrls = [];
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedImages = Array.from(input.files);
      this.imagePreviewUrls = [];
      
      this.selectedImages.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imagePreviewUrls[index] = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number): void {
    this.imagePreviewUrls.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  toggleAmenity(amenity: string): void {
    const currentAmenities = this.propertyForm.get('amenities')?.value || [];
    const index = currentAmenities.indexOf(amenity);
    
    if (index > -1) {
      currentAmenities.splice(index, 1);
    } else {
      currentAmenities.push(amenity);
    }
    
    this.propertyForm.patchValue({ amenities: currentAmenities });
  }

  isAmenitySelected(amenity: string): boolean {
    const amenities = this.propertyForm.get('amenities')?.value || [];
    return amenities.includes(amenity);
  }

  saveProperty(): void {
    if (this.propertyForm.invalid) return;
    
    this.saving = true;
    const formValue = this.propertyForm.value;
    
    const propertyData: CreatePropertyRequest = {
      title: formValue.title,
      description: formValue.description,
      price: Number(formValue.price),
      type: formValue.type,
      bedrooms: Number(formValue.bedrooms),
      bathrooms: Number(formValue.bathrooms),
      area: Number(formValue.area),
      location: {
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        zipCode: formValue.zipCode
      },
      amenities: formValue.amenities
    };

    const saveOperation = this.editingProperty
      ? this.propertyService.updateProperty(this.editingProperty._id, new FormData()) // You'd need to convert to FormData
      : this.propertyService.createProperty(propertyData);

    saveOperation.subscribe({
      next: (property: Property) => {
        if (this.selectedImages.length > 0) {
          this.uploadImages(property._id);
        } else {
          this.onSaveComplete();
        }
      },
      error: (error: any) => {
        this.showMessage('Failed to save property', 'error');
        this.saving = false;
      }
    });
  }

  uploadImages(propertyId: string): void {
    if (this.selectedImages.length === 0) {
      this.onSaveComplete();
      return;
    }

    this.propertyService.uploadPropertyImages(propertyId, this.selectedImages).subscribe({
      next: () => {
        this.onSaveComplete();
      },
      error: (error: any) => {
        this.showMessage('Property saved but failed to upload images', 'error');
        this.saving = false;
      }
    });
  }

  onSaveComplete(): void {
    this.showMessage(
      this.editingProperty ? 'Property updated successfully' : 'Property created successfully',
      'success'
    );
    this.saving = false;
    this.closeModal();
    this.loadProperties();
  }

  deleteProperty(property: Property): void {
    if (!confirm(`Are you sure you want to delete "${property.title}"?`)) {
      return;
    }

    this.propertyService.deleteProperty(property._id).subscribe({
      next: () => {
        this.showMessage('Property deleted successfully', 'success');
        this.loadProperties();
      },
      error: (error: any) => {
        this.showMessage('Failed to delete property', 'error');
      }
    });
  }

  getStatusClass(status: string): string {
    const statusType = this.statusTypes.find(s => s.value === status);
    return statusType ? `badge-${statusType.class}` : 'badge-secondary';
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  getFieldError(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
    }
    return '';
  }
}