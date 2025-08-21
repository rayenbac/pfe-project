import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AgencyService } from '../../../../core/services/agency.service';
import { UploadService } from '../../../../core/services/upload.service';
import { Agency } from '../../../../core/models/agency.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agency-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" [class.show]="isVisible" [style.display]="isVisible ? 'block' : 'none'" 
         tabindex="-1" role="dialog" aria-labelledby="agencyModalLabel" [attr.aria-hidden]="!isVisible">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title" id="agencyModalLabel">
              {{isEditing ? 'Edit Agency' : 'Create New Agency'}}
            </h4>
            <button type="button" class="close" (click)="closeModal()" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form [formGroup]="agencyForm" (ngSubmit)="onSubmit()">
              <!-- Agency Logo -->
              <div class="form-group mb-3">
                <label for="agencyLogo">Agency Logo</label>
                <div class="upload-area">
                  <input type="file" id="agencyLogo" accept="image/*" (change)="onLogoSelected($event)" class="d-none">
                  <label for="agencyLogo" class="upload-label">
                    <div class="logo-preview" *ngIf="logoPreview">
                      <img [src]="logoPreview" alt="Agency Logo" class="preview-image">
                    </div>
                    <div class="upload-placeholder" *ngIf="!logoPreview">
                      <i class="fa fa-cloud-upload-alt fa-2x text-muted"></i>
                      <p class="text-muted">Click to upload agency logo</p>
                      <small class="text-muted">Recommended: 200x200px, max 2MB</small>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Agency Name -->
              <div class="form-group mb-3">
                <label for="agencyName">Agency Name *</label>
                <input type="text" class="form-control" id="agencyName" 
                       formControlName="name" placeholder="Enter agency name">
                <div class="invalid-feedback" *ngIf="agencyForm.get('name')?.invalid && agencyForm.get('name')?.touched">
                  Agency name is required
                </div>
              </div>

              <!-- Description -->
              <div class="form-group mb-3">
                <label for="agencyDescription">Description *</label>
                <textarea class="form-control" id="agencyDescription" rows="4" 
                          formControlName="description" placeholder="Describe your agency..."></textarea>
                <div class="invalid-feedback" *ngIf="agencyForm.get('description')?.invalid && agencyForm.get('description')?.touched">
                  Description is required
                </div>
              </div>

              <!-- Email -->
              <div class="form-group mb-3">
                <label for="agencyEmail">Email *</label>
                <input type="email" class="form-control" id="agencyEmail" 
                       formControlName="email" placeholder="agency@example.com">
                <div class="invalid-feedback" *ngIf="agencyForm.get('email')?.invalid && agencyForm.get('email')?.touched">
                  Valid email is required
                </div>
              </div>

              <!-- Phone -->
              <div class="form-group mb-3">
                <label for="agencyPhone">Phone *</label>
                <div class="input-group">
                  <select class="form-control" formControlName="countryCode" style="max-width: 120px;">
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+216">🇹🇳 +216</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                  </select>
                  <input type="tel" class="form-control" formControlName="phoneNumber" 
                         placeholder="12345678" maxlength="15">
                </div>
                <div class="invalid-feedback" *ngIf="agencyForm.get('phoneNumber')?.invalid && agencyForm.get('phoneNumber')?.touched">
                  Phone number is required
                </div>
              </div>

              <!-- Address -->
              <div class="form-group mb-3">
                <label for="agencyAddress">Address *</label>
                <input type="text" class="form-control" id="agencyAddress" 
                       formControlName="address" placeholder="Agency address">
                <div class="invalid-feedback" *ngIf="agencyForm.get('address')?.invalid && agencyForm.get('address')?.touched">
                  Address is required
                </div>
              </div>

              <!-- Website -->
              <div class="form-group mb-3">
                <label for="agencyWebsite">Website</label>
                <input type="url" class="form-control" id="agencyWebsite" 
                       formControlName="website" placeholder="https://www.yourwebsite.com">
              </div>

              <!-- License Number -->
              <div class="form-group mb-3">
                <label for="licenseNumber">License Number *</label>
                <input type="text" class="form-control" id="licenseNumber" 
                       formControlName="licenseNumber" placeholder="Enter license number">
                <div class="invalid-feedback" *ngIf="agencyForm.get('licenseNumber')?.invalid && agencyForm.get('licenseNumber')?.touched">
                  License number is required
                </div>
              </div>

              <!-- Founded Year -->
              <div class="form-group mb-3">
                <label for="foundedYear">Founded Year *</label>
                <select class="form-control" id="foundedYear" formControlName="foundedYear">
                  <option value="">Select year</option>
                  <option *ngFor="let year of years" [value]="year">{{year}}</option>
                </select>
                <div class="invalid-feedback" *ngIf="agencyForm.get('foundedYear')?.invalid && agencyForm.get('foundedYear')?.touched">
                  Founded year is required
                </div>
              </div>

              <!-- Services -->
              <div class="form-group mb-3">
                <label>Services Offered</label>
                <div class="services-checkboxes">
                  <div class="form-check" *ngFor="let service of availableServices">
                    <input class="form-check-input" type="checkbox" 
                           [value]="service" [id]="'service-' + service"
                           (change)="onServiceChange(service, $event)">
                    <label class="form-check-label" [for]="'service-' + service">
                      {{service}}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Specializations -->
              <div class="form-group mb-3">
                <label>Specializations</label>
                <div class="specializations-checkboxes">
                  <div class="form-check" *ngFor="let spec of availableSpecializations">
                    <input class="form-check-input" type="checkbox" 
                           [value]="spec" [id]="'spec-' + spec"
                           (change)="onSpecializationChange(spec, $event)">
                    <label class="form-check-label" [for]="'spec-' + spec">
                      {{spec}}
                    </label>
                  </div>
                </div>
              </div>

              <!-- Social Media -->
              <div class="form-group mb-3">
                <label>Social Media</label>
                <div class="row">
                  <div class="col-md-6">
                    <input type="url" class="form-control mb-2" 
                           formControlName="facebook" placeholder="Facebook URL">
                  </div>
                  <div class="col-md-6">
                    <input type="url" class="form-control mb-2" 
                           formControlName="twitter" placeholder="Twitter URL">
                  </div>
                  <div class="col-md-6">
                    <input type="url" class="form-control mb-2" 
                           formControlName="instagram" placeholder="Instagram URL">
                  </div>
                  <div class="col-md-6">
                    <input type="url" class="form-control mb-2" 
                           formControlName="linkedin" placeholder="LinkedIn URL">
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="onSubmit()" 
                    [disabled]="agencyForm.invalid || isLoading">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              {{isEditing ? 'Update Agency' : 'Create Agency'}}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible"></div>
  `,
  styles: [`
    .upload-area {
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.3s;
    }

    .upload-area:hover {
      border-color: #007bff;
    }

    .upload-label {
      display: block;
      cursor: pointer;
      margin: 0;
    }

    .preview-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
    }

    .services-checkboxes,
    .specializations-checkboxes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }

    .form-check {
      margin-bottom: 5px;
    }

    .invalid-feedback {
      display: block;
    }

    .modal {
      z-index: 1050;
    }

    .modal-backdrop {
      z-index: 1040;
    }

    .close {
      background: none;
      border: none;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      color: #000;
      text-shadow: 0 1px 0 #fff;
      opacity: 0.5;
      cursor: pointer;
    }

    .close:hover {
      opacity: 0.75;
    }
  `]
})
export class AgencyModalComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() agency: Agency | null = null;
  @Input() isEditing: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() agencyCreated = new EventEmitter<Agency>();
  @Output() agencyUpdated = new EventEmitter<Agency>();

  agencyForm: FormGroup;
  logoFile: File | null = null;
  logoPreview: string | null = null;
  isLoading: boolean = false;
  years: number[] = [];
  selectedServices: string[] = [];
  selectedSpecializations: string[] = [];

  availableServices = [
    'Property Sales',
    'Property Rentals',
    'Property Management',
    'Investment Consulting',
    'Property Valuation',
    'Legal Services',
    'Mortgage Assistance',
    'Interior Design'
  ];

  availableSpecializations = [
    'Residential Properties',
    'Commercial Properties',
    'Luxury Properties',
    'New Developments',
    'International Properties',
    'Investment Properties',
    'Vacation Rentals',
    'Land Sales'
  ];

  constructor(
    private fb: FormBuilder,
    private agencyService: AgencyService,
    private uploadService: UploadService
  ) {
    this.agencyForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+216', Validators.required],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      website: [''],
      licenseNumber: ['', Validators.required],
      foundedYear: ['', Validators.required],
      facebook: [''],
      twitter: [''],
      instagram: [''],
      linkedin: ['']
    });

    // Generate years from 1950 to current year
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    if (this.isEditing && this.agency) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (!this.agency) return;

    this.agencyForm.patchValue({
      name: this.agency.name,
      description: this.agency.description,
      email: this.agency.email,
      phoneNumber: this.agency.phone,
      address: this.agency.address,
      website: this.agency.website,
      licenseNumber: this.agency.licenseNumber,
      foundedYear: this.agency.foundedYear,
      facebook: this.agency.socialMedia?.facebook,
      twitter: this.agency.socialMedia?.twitter,
      instagram: this.agency.socialMedia?.instagram,
      linkedin: this.agency.socialMedia?.linkedin
    });

    // Set logo preview
    if (this.agency.logo) {
      this.logoPreview = this.agency.logo;
    }

    // Set selected services and specializations
    this.selectedServices = this.agency.services || [];
    this.selectedSpecializations = this.agency.specializations || [];
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.logoFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onServiceChange(service: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices = this.selectedServices.filter(s => s !== service);
    }
  }

  onSpecializationChange(specialization: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedSpecializations.push(specialization);
    } else {
      this.selectedSpecializations = this.selectedSpecializations.filter(s => s !== specialization);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.agencyForm.invalid) return;

    this.isLoading = true;

    try {
      const formValue = this.agencyForm.value;
      const formData = new FormData();
      
      // Add basic agency data
      formData.append('name', formValue.name);
      formData.append('description', formValue.description);
      formData.append('email', formValue.email);
      formData.append('phone', formValue.countryCode + formValue.phoneNumber);
      formData.append('address', formValue.address);
      formData.append('licenseNumber', formValue.licenseNumber);
      formData.append('foundedYear', formValue.foundedYear.toString());
      
      // Add optional fields
      if (formValue.website) {
        formData.append('website', formValue.website);
      }
      
      // Add logo file if selected
      if (this.logoFile) {
        formData.append('logo', this.logoFile);
      }
      
      // Add services and specializations as JSON strings
      formData.append('services', JSON.stringify(this.selectedServices));
      formData.append('specializations', JSON.stringify(this.selectedSpecializations));
      
      // Add social media as JSON string
      const socialMedia = {
        facebook: formValue.facebook,
        twitter: formValue.twitter,
        instagram: formValue.instagram,
        linkedin: formValue.linkedin
      };
      formData.append('socialMedia', JSON.stringify(socialMedia));

      if (this.isEditing && this.agency) {
        // Update existing agency
        const updatedAgency = await this.agencyService.updateAgency(this.agency._id, formData).toPromise();
        this.agencyUpdated.emit(updatedAgency);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Agency updated successfully!'
        });
      } else {
        // Create new agency
        const newAgency = await this.agencyService.createAgency(formData).toPromise();
        this.agencyCreated.emit(newAgency);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Agency created successfully!'
        });
      }

      this.closeModal();

    } catch (error) {
      console.error('Error saving agency:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save agency. Please try again.'
      });
    } finally {
      this.isLoading = false;
    }
  }

  closeModal(): void {
    this.isVisible = false;
    this.closed.emit();
    
    // Reset form
    this.agencyForm.reset();
    this.logoFile = null;
    this.logoPreview = null;
    this.selectedServices = [];
    this.selectedSpecializations = [];
  }
}
