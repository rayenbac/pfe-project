import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/user.model';
import { Property } from '../../../core/models/property.model';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';
import { AgencyService } from '../../../core/services/agency.service';
import { Agency } from '../../../core/models/agency.model';
import { UploadService, UploadResponse } from '../../../core/services/upload.service';
import { Router } from '@angular/router';
import { RecommenderService, Recommendation, RecommendationResponse } from '../../../core/services/recommender.service';
import { SignatureService, SignatureData } from '../../../core/services/signature.service';
import { AgencyModalComponent } from './agency-modal/agency-modal.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AgencyModalComponent,
    UserDashboardComponent,
    SignaturePadComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  protected environment = environment;
  currentUser: User | null = null;
  isLoading: boolean = true;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  activeTab: string = 'profile';
  currentYear: number = new Date().getFullYear();
  
  // Phone number properties
  selectedCountryCode: string = '+1';
  phoneNumber: string = '';
  
  // Common country codes
  countryCodes = [
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+34', name: 'Spain', flag: '🇪🇸' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
    { code: '+212', name: 'Morocco', flag: '🇲🇦' },
    { code: '+213', name: 'Algeria', flag: '🇩🇿' },
    { code: '+20', name: 'Egypt', flag: '🇪🇬' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', name: 'Oman', flag: '🇴🇲' },
    { code: '+962', name: 'Jordan', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
    { code: '+963', name: 'Syria', flag: '🇸🇾' },
    { code: '+964', name: 'Iraq', flag: '🇮🇶' },
    { code: '+90', name: 'Turkey', flag: '🇹🇷' }
  ];
  
  // Properties for different tabs - simplified for dashboard delegation
  favorites: any[] = [];
  
  // Loading states
  loadingFavorites: boolean = false;

  // Filters
  favoriteFilter: string = 'properties';
  reviewFilter: string = 'given';
  reservationFilter: string = '';
  invoiceFilter: string = '';
  favoriteSortBy: string = 'dateAdded';

  // Additional properties
  loading: boolean = false;
  property: Property | null = null;
  agencyForm: FormGroup;
  newAgencyForm: FormGroup;
  agencies: Agency[] = [];
  selectedAgency: Agency | null = null;
  loadingAgencies: boolean = false;
  isCreatingAgency: boolean = false;
  isAgencyOwner: boolean = false;
  agencyImagePreview: string | null = null;
  isEditingAgency: boolean = false;
  agencyLogoFile: File | null = null;
  private selectedAgencyCountryCode: string = '+1';
  userPosts: any[] = [];
  loadingPosts: boolean = false;
  recommendations: Recommendation[] = [];
  loadingRecommendations: boolean = false;
  recommenderError: string | null = null;
  
  // Agency modal properties
  showAgencyModal: boolean = false;
  selectedAgencyForEdit: Agency | null = null;
  isEditingAgencyModal: boolean = false;

  // Electronic Signature properties
  currentSignature: any = null;
  showCreateSignature: boolean = false;
  loadingSignature: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private agencyService: AgencyService,
    private uploadService: UploadService,
    private router: Router,
    private recommenderService: RecommenderService,
    private signatureService: SignatureService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\+[1-9]\d{1,4}\d{6,15}$/),
        Validators.minLength(9),
        Validators.maxLength(17)
      ]],
      address: [''],
      description: [''],
      facebook: [''],
      twitter: [''],
      linkedin: [''],
      instagram: [''],
      website: [''],
      skype: [''],
      youtube: [''],
      pinterest: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.agencyForm = this.fb.group({
      agencyId: ['']
    });

    this.newAgencyForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      website: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        address: this.currentUser.address || '',
        description: this.currentUser.description || '',
        facebook: this.currentUser.socialMedia?.facebook || '',
        twitter: this.currentUser.socialMedia?.twitter || '',
        linkedin: this.currentUser.socialMedia?.linkedin || '',
        instagram: this.currentUser.socialMedia?.instagram || '',
        website: this.currentUser.website || '',
        skype: this.currentUser.skype || '',
        youtube: this.currentUser.socialMedia?.youtube || '',
        pinterest: this.currentUser.socialMedia?.pinterest || ''
      });
      
      if (this.currentUser.phone) {
        this.parseExistingPhone(this.currentUser.phone);
      }
      
      if (!this.isAgent() && this.activeTab === 'properties') {
        this.activeTab = 'favorites';
      }
      
      this.loadTabData(this.activeTab);
      
      if (this.isAgent()) {
        this.loadAgencies();
        this.checkAgencyOwnership();
      }
      this.loadAgentSignature(); // Load signature for all users for testing
      this.loadRecommendations();
    }
    this.isLoading = false;
  }

  // Tab management - now delegates to dashboard component
  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Dashboard component will handle specific data loading
  }

  onTabChanged(tab: string) {
    // Don't change parent activeTab for dashboard sub-tabs
    // Only handle parent-level tabs (profile, dashboard, agency, favorites)
    const parentTabs = ['profile', 'dashboard', 'agency', 'favorites'];
    if (parentTabs.includes(tab)) {
      this.activeTab = tab;
    }
    // Dashboard component will handle its own internal tab switching
  }

  // Simplified tab data loading - delegated to specific components
  loadTabData(tab: string) {
    if (tab === 'properties' && !this.isAgent()) {
      this.activeTab = 'favorites';
      return;
    }
    
    this.activeTab = tab;
    // Data loading is now handled by individual components (dashboard, favorites, etc.)
  }

  // === HELPER METHODS ===

  isAgent(): boolean {
    return this.currentUser?.role === UserRole.AGENT;
  }

  // === EXISTING PROFILE METHODS (unchanged) ===

  parseExistingPhone(phone: string) {
    const countryCode = this.countryCodes.find(cc => phone.startsWith(cc.code));
    if (countryCode) {
      this.selectedCountryCode = countryCode.code;
      this.phoneNumber = phone.substring(countryCode.code.length);
    } else {
      this.selectedCountryCode = '+1';
      this.phoneNumber = phone;
    }
  }

  onCountryCodeChange(event: any) {
    this.selectedCountryCode = event.target.value;
    this.updatePhoneField();
  }

  onPhoneNumberChange(event: any) {
    this.phoneNumber = event.target.value;
    this.updatePhoneField();
  }

  updatePhoneField() {
    const fullPhone = this.selectedCountryCode + this.phoneNumber;
    this.profileForm.patchValue({ phone: fullPhone });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('newPassword');
    const confirmPassword = g.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value 
      ? null 
      : { 'mismatch': true };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    
    if (this.selectedFile) {
      this.uploadService.uploadFile(this.selectedFile, 'users').subscribe({
        next: (uploadResponse: UploadResponse) => {
          this.updateUserProfile(uploadResponse.url);
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to upload profile image'
          });
        }
      });
    } else {
      this.updateUserProfile();
    }
  }

  private updateUserProfile(profileImagePath?: string) {
    const formData = this.profileForm.value;
    
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      description: formData.description,
      website: formData.website,
      skype: formData.skype,
      socialMedia: {
        facebook: formData.facebook,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
        instagram: formData.instagram,
        youtube: formData.youtube,
        pinterest: formData.pinterest
      }
    };

    if (profileImagePath) {
      updateData.profileImage = profileImagePath;
    }

    this.userService.updateUser(this.currentUser!._id, updateData).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        this.authService.updateCurrentUser(updatedUser);
        this.loading = false;
        this.selectedFile = null;
        this.imagePreview = null;
        
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been successfully updated!',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Update error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update profile. Please try again.'
        });
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const passwordData = this.passwordForm.value;

    this.userService.changePassword(passwordData.currentPassword, passwordData.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.passwordForm.reset();
        
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          text: 'Your password has been successfully changed!',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Password change error:', error);
        
        let errorMessage = 'Failed to change password. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Password Change Failed',
          text: errorMessage
        });
      }
    });
  }

  // === AGENCY METHODS ===

  loadAgencies() {
    this.loadingAgencies = true;
    this.agencyService.getAgencies().subscribe({
      next: (agencies: any) => {
        this.agencies = agencies;
        this.loadingAgencies = false;
      },
      error: (error: any) => {
        console.error('Error loading agencies:', error);
        this.loadingAgencies = false;
      }
    });
  }

  checkAgencyOwnership() {
    if (!this.currentUser || this.currentUser.role !== UserRole.AGENT) return;
    
    // For now, set to false since getAgencyByOwner doesn't exist
    this.isAgencyOwner = false;
  }

  // === RECOMMENDATION METHODS ===

  loadRecommendations() {
    if (!this.currentUser) return;
    
    this.loadingRecommendations = true;
    this.recommenderError = null;
    
    this.recommenderService.getRecommendations(this.currentUser._id).subscribe({
      next: (response: RecommendationResponse) => {
        this.recommendations = response.recommendations || [];
        this.loadingRecommendations = false;
      },
      error: (error) => {
        console.error('Recommendation service error:', error);
        this.recommendations = [];
        this.loadingRecommendations = false;
        
        if (error.status === 500 && error.error?.error?.includes('no interactions found')) {
          this.recommenderError = 'No interaction history found. Start browsing properties to get personalized recommendations!';
        } else {
          this.recommenderError = 'Unable to load recommendations at this time. Please try again later.';
        }
      }
    });
  }

  // === UTILITY METHODS ===

  getProfileImageUrl(): string {
    if (this.imagePreview) {
      return this.imagePreview;
    }
    
    if (this.currentUser?.profileImage) {
      const baseUrl = environment.apiBaseUrl.replace('/api', '');
      if (this.currentUser.profileImage.startsWith('/uploads/')) {
        return baseUrl + this.currentUser.profileImage;
      }
      if (this.currentUser.profileImage.startsWith('http')) {
        return this.currentUser.profileImage;
      }
      return baseUrl + '/uploads/' + this.currentUser.profileImage;
    }
    
    return 'assets/images/property/owner.webp';
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim() || this.currentUser.email;
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return 'assets/images/property/default.jpg';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const baseUrl = environment.apiBaseUrl.replace('/api', '');
    return imagePath.startsWith('/uploads/') ? baseUrl + imagePath : imagePath;
  }

  // === AGENCY MODAL METHODS ===

  openCreateAgencyModal(): void {
    this.selectedAgencyForEdit = null;
    this.isEditingAgencyModal = false;
    this.showAgencyModal = true;
  }

  openEditAgencyModal(agency: Agency): void {
    this.selectedAgencyForEdit = agency;
    this.isEditingAgencyModal = true;
    this.showAgencyModal = true;
  }

  closeAgencyModal(): void {
    this.showAgencyModal = false;
    this.selectedAgencyForEdit = null;
    this.isEditingAgencyModal = false;
  }

  onAgencyCreated(agency: Agency): void {
    this.agencies.push(agency);
    this.selectedAgency = agency;
    this.closeAgencyModal();
    this.loadAgencies();
  }

  onAgencyUpdated(agency: Agency): void {
    const index = this.agencies.findIndex(a => a._id === agency._id);
    if (index !== -1) {
      this.agencies[index] = agency;
    }
    if (this.selectedAgency && this.selectedAgency._id === agency._id) {
      this.selectedAgency = agency;
    }
    this.closeAgencyModal();
    this.loadAgencies();
  }

  // Electronic Signature Methods
  loadAgentSignature(): void {
    // Temporarily disable backend call due to API errors - Updated
    // TODO: Re-enable when backend is fixed
    this.loadingSignature = false;
    this.currentSignature = null; // Start with no signature
    
    /*
    // Uncomment when backend is working:
    this.loadingSignature = true;
    this.signatureService.getAgentSignature().subscribe({
      next: (response) => {
        if (response.success && response.signature) {
          this.currentSignature = response.signature;
        }
        this.loadingSignature = false;
      },
      error: (error) => {
        console.error('Error loading signature:', error);
        this.loadingSignature = false;
      }
    });
    */
  }

  onSignatureCreated(signatureData: SignatureData): void {
    this.loadingSignature = true;
    
    const isUpdating = !!this.currentSignature;
    const actionText = isUpdating ? 'updated' : 'saved';
    
    // For now, simulate saving since backend has errors
    // TODO: Replace with actual API call when backend is fixed
    setTimeout(() => {
      const previousSignature = this.currentSignature;
      
      this.currentSignature = {
        signatureImage: signatureData.signatureImage,
        signatureFont: signatureData.signatureFont,
        signatureText: signatureData.signatureText,
        signatureType: signatureData.signatureType,
        uploadedAt: isUpdating ? previousSignature?.uploadedAt : new Date(),
        lastUpdated: new Date(),
        isActive: true
      };
      
      this.showCreateSignature = false;
      this.loadingSignature = false;
      
      Swal.fire({
        icon: 'success',
        title: isUpdating ? 'Signature Updated!' : 'Signature Saved!',
        text: `Your electronic signature has been ${actionText} successfully. This signature will be used for all future contracts.`,
        confirmButtonColor: '#3085d6',
        timer: 3000,
        timerProgressBar: true
      });
    }, 1000);
    
    /* 
    // Uncomment this when backend is working:
    const apiCall = isUpdating 
      ? this.signatureService.updateAgentSignature(signatureData)
      : this.signatureService.saveAgentSignature(signatureData);
      
    apiCall.subscribe({
      next: (response) => {
        if (response && response.success) {
          this.currentSignature = response.signature;
          this.showCreateSignature = false;
          
          Swal.fire({
            icon: 'success',
            title: isUpdating ? 'Signature Updated!' : 'Signature Saved!',
            text: `Your electronic signature has been ${actionText} successfully.`,
            confirmButtonColor: '#3085d6'
          });
        } else {
          console.error('Save signature failed:', response);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: `Failed to ${actionText.slice(0, -1)} your signature. Please try again.`,
            confirmButtonColor: '#d33'
          });
        }
        this.loadingSignature = false;
      },
      error: (error) => {
        console.error('Error saving signature:', error);
        this.loadingSignature = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: `Failed to ${actionText.slice(0, -1)} your signature. Please try again.`,
          confirmButtonColor: '#d33'
        });
      }
    });
    */
  }

  updateSignature(): void {
    Swal.fire({
      title: 'Update Your Signature?',
      text: 'This will replace your current signature. The new signature will be used for all future contracts.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.showCreateSignature = true;
      }
    });
  }

  deleteSignature(): void {
    Swal.fire({
      title: 'Delete Signature?',
      text: 'Are you sure you want to delete your electronic signature? You will need to create a new one for future contracts.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performDeleteSignature();
      }
    });
  }

  private performDeleteSignature(): void {
    this.loadingSignature = true;
    
    // Simulate deletion for now since backend has errors
    setTimeout(() => {
      this.currentSignature = null;
      this.loadingSignature = false;
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Your signature has been deleted.',
        confirmButtonColor: '#3085d6'
      });
    }, 500);
    
    /*
    // TODO: Implement actual API call when backend is working
    this.signatureService.deleteAgentSignature().subscribe({
      next: (response) => {
        this.currentSignature = null;
        this.loadingSignature = false;
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Your signature has been deleted.',
          confirmButtonColor: '#3085d6'
        });
      },
      error: (error) => {
        console.error('Error deleting signature:', error);
        this.loadingSignature = false;
        
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to delete your signature. Please try again.',
          confirmButtonColor: '#d33'
        });
      }
    });
    */
  }

  cancelSignatureUpdate(): void {
    this.showCreateSignature = false;
  }
}
