import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  user: User | null = null;
  loading = false;
  updating = false;
  changingPassword = false;
  avatarPreview: string | null = null;
  selectedFile: File | null = null;
  activeTab = 'profile';
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      bio: ['', [Validators.maxLength(500)]],
      emailNotifications: [true],
      smsNotifications: [false],
      marketingEmails: [false],
      privacyMode: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.user = user;
        this.profileForm.patchValue({
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone || '',
          bio: user.description || '',
          emailNotifications: true, // Default values since User model doesn't have preferences
          smsNotifications: false,
          marketingEmails: false,
          privacyMode: false
        });
        this.avatarPreview = user.profileImage || null;
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load profile', 'error');
        this.loading = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      // Validate file type
      if (!this.selectedFile.type.startsWith('image/')) {
        this.showMessage('Please select a valid image file', 'error');
        return;
      }
      
      // Validate file size (5MB limit)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        this.showMessage('File size must be less than 5MB', 'error');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.updating = true;
    const formValue = this.profileForm.value;
    
    const updateData = {
      firstName: formValue.name.split(' ')[0] || formValue.name,
      lastName: formValue.name.split(' ').slice(1).join(' ') || '',
      phone: formValue.phone,
      description: formValue.bio
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (user: User) => {
        this.user = user;
        this.showMessage('Profile updated successfully', 'success');
        
        // Upload avatar if selected
        if (this.selectedFile) {
          this.uploadAvatar();
        } else {
          this.updating = false;
        }
      },
      error: (error: any) => {
        this.showMessage('Failed to update profile', 'error');
        this.updating = false;
      }
    });
  }

  uploadAvatar(): void {
    if (!this.selectedFile) return;
    
    this.userService.uploadAvatar(this.selectedFile).subscribe({
      next: (response: any) => {
        if (this.user) {
          this.user.profileImage = response.profileImage || response.avatarUrl;
        }
        this.selectedFile = null;
        this.showMessage('Avatar updated successfully', 'success');
        this.updating = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to upload avatar', 'error');
        this.updating = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    
    this.changingPassword = true;
    const passwordData = this.passwordForm.value;
    
    this.userService.changePassword(passwordData.currentPassword, passwordData.newPassword).subscribe({
      next: () => {
        this.showMessage('Password changed successfully', 'success');
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: (error: any) => {
        this.showMessage(error.error?.message || 'Failed to change password', 'error');
        this.changingPassword = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessage();
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

  getFieldError(fieldName: string, formGroup: FormGroup = this.profileForm): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }
}