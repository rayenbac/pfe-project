import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { VerificationService } from '../../core/services/verification.service';
import { AuthService } from '../../core/services/auth.service';
import { VerificationStatusResponse, VerificationStatus } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification-workflow.component.html',
  styleUrls: ['./verification-workflow.component.css']
})
export class VerificationWorkflowComponent implements OnInit, OnDestroy {
  @Input() showInModal = false;
  @Input() redirectOnComplete = true;
  @Input() completionRoute = '/profile';
  @Output() verificationComplete = new EventEmitter<VerificationStatusResponse>();
  @Output() workflowCancelled = new EventEmitter<void>();

  verificationStatus: VerificationStatusResponse | null = null;
  currentStep: string = 'loading';
  isLoading = false;
  error: string | null = null;

  // Email verification
  emailSent = false;
  emailSending = false;

  // Document upload
  idDocumentFile: File | null = null;
  selfieFile: File | null = null;
  idImagePreview: string | null = null;
  selfiePreview: string | null = null;
  uploadProgress = 0;

  private subscription = new Subscription();

  constructor(
    private verificationService: VerificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVerificationStatus();
    this.subscribeToStatusUpdates();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadVerificationStatus(): void {
    this.isLoading = true;
    this.error = null;

    this.subscription.add(
      this.verificationService.getVerificationStatus().subscribe({
        next: (status) => {
          this.verificationStatus = status;
          this.currentStep = this.getNextStep(status.verification);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load verification status:', error);
          this.error = 'Failed to load verification status. Please try again.';
          this.isLoading = false;
        }
      })
    );
  }

  private subscribeToStatusUpdates(): void {
    this.subscription.add(
      this.verificationService.verificationStatus$.subscribe(status => {
        if (status) {
          this.verificationStatus = status;
          this.currentStep = this.getNextStep(status.verification);
          
          // Check if verification is complete
          if (status.verification.status === 'verified') {
            this.onVerificationComplete(status);
          }
        }
      })
    );
  }

  private getNextStep(verification: VerificationStatus): string {
    switch (verification.status) {
      case 'unverified':
        return 'email_verification';
      case 'email_pending':
        return 'email_pending';
      case 'email_verified':
        return 'document_upload';
      case 'documents_pending':
      case 'documents_uploaded':
        return 'face_comparison';
      case 'face_verified':
        return 'verification_complete';
      case 'verified':
        return 'verification_complete';
      case 'failed':
        return 'verification_failed';
      default:
        return 'email_verification';
    }
  }

  // Email Verification Methods
  sendEmailVerification(): void {
    if (!this.authService.isAuthenticated()) {
      this.error = 'Please log in to verify your email.';
      return;
    }

    this.emailSending = true;
    this.error = null;

    this.subscription.add(
      this.verificationService.sendEmailVerification(window.location.origin).subscribe({
        next: (response) => {
          this.emailSent = true;
          this.emailSending = false;
          this.currentStep = 'email_pending';
          
          Swal.fire({
            title: 'Email Sent!',
            text: 'Please check your email and click the verification link.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Email verification error:', error);
          this.emailSending = false;
          this.error = error.error?.message || 'Failed to send verification email. Please try again.';
        }
      })
    );
  }

  checkEmailVerification(): void {
    this.loadVerificationStatus();
  }

  // Document Upload Methods
  onIdDocumentSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.isValidImageFile(file)) {
      this.idDocumentFile = file;
      this.previewImage(file, 'id');
    } else {
      this.showInvalidFileError();
    }
  }

  onSelfieSelected(event: any): void {
    const file = event.target.files[0];
    if (file && this.isValidImageFile(file)) {
      this.selfieFile = file;
      this.previewImage(file, 'selfie');
    } else {
      this.showInvalidFileError();
    }
  }

  removeSelfie(): void {
    this.selfieFile = null;
    this.selfiePreview = null;
    // Clear file input if needed
    const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  removeIdDocument(): void {
    this.idDocumentFile = null;
    this.idImagePreview = null;
    // Clear file input if needed
    const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  private isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  private previewImage(file: File, type: 'id' | 'selfie'): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'id') {
        this.idImagePreview = e.target?.result as string;
      } else {
        this.selfiePreview = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  private showInvalidFileError(): void {
    Swal.fire({
      title: 'Invalid File',
      text: 'Please select a valid image file (JPEG, JPG, PNG) under 10MB.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }

  uploadDocuments(): void {
    if (!this.idDocumentFile || !this.selfieFile) {
      this.error = 'Please select both an ID document and a selfie with ID.';
      return;
    }

    this.isLoading = true;
    this.uploadProgress = 0;
    this.error = null;

    this.subscription.add(
      this.verificationService.uploadDocuments(this.idDocumentFile, this.selfieFile).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.uploadProgress = 100;
          
          Swal.fire({
            title: 'Documents Uploaded!',
            text: 'Your documents have been uploaded successfully. Proceeding to face verification.',
            icon: 'success',
            confirmButtonText: 'Continue'
          });

          // Refresh status to get updated information
          this.loadVerificationStatus();
        },
        error: (error) => {
          console.error('Document upload error:', error);
          this.isLoading = false;
          this.uploadProgress = 0;
          this.error = error.error?.message || 'Failed to upload documents. Please try again.';
        }
      })
    );
  }

  // Face Comparison Methods
  startFaceComparison(): void {
    // Navigate to the existing face comparison component
    if (this.showInModal) {
      // If in modal, emit event to parent to handle navigation
      this.router.navigate(['/verification']);
    } else {
      // Direct navigation
      this.router.navigate(['/verification']);
    }
  }

  // Retry Methods
  retryVerification(): void {
    if (!this.verificationStatus) return;

    let retryStep: 'email' | 'documents' | 'face' = 'email';

    if (this.verificationStatus.verification.emailVerified) {
      retryStep = 'documents';
    }
    if (this.verificationStatus.verification.documentsUploaded) {
      retryStep = 'face';
    }

    this.isLoading = true;
    this.error = null;

    this.subscription.add(
      this.verificationService.retryVerification(retryStep).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.loadVerificationStatus();
          
          Swal.fire({
            title: 'Verification Reset',
            text: 'Your verification has been reset. Please try again.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Retry verification error:', error);
          this.isLoading = false;
          this.error = error.error?.message || 'Failed to retry verification. Please contact support.';
        }
      })
    );
  }

  // Navigation Methods
  skipVerification(): void {
    if (this.showInModal) {
      this.workflowCancelled.emit();
    } else {
      this.router.navigate(['/profile']);
    }
  }

  onVerificationComplete(status: VerificationStatusResponse): void {
    this.verificationComplete.emit(status);
    
    if (this.redirectOnComplete && !this.showInModal) {
      Swal.fire({
        title: 'Verification Complete!',
        text: 'Your identity has been successfully verified. You now have full access to all platform features.',
        icon: 'success',
        confirmButtonText: 'Continue'
      }).then(() => {
        this.router.navigate([this.completionRoute]);
      });
    }
  }

  // Utility Methods
  getProgressPercentage(): number {
    if (!this.verificationStatus) return 0;

    const verification = this.verificationStatus.verification;
    let progress = 0;

    if (verification.emailVerified) progress += 33;
    if (verification.documentsUploaded) progress += 33;
    if (verification.faceVerified) progress += 34;

    return Math.min(progress, 100);
  }

  getStatusText(): string {
    if (!this.verificationStatus) return 'Loading...';

    switch (this.verificationStatus.verification.status) {
      case 'unverified':
        return 'Not Started';
      case 'email_pending':
        return 'Email Verification Pending';
      case 'email_verified':
        return 'Email Verified';
      case 'documents_pending':
      case 'documents_uploaded':
        return 'Documents Processing';
      case 'face_verified':
        return 'Face Verification Complete';
      case 'verified':
        return 'Fully Verified';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Unknown Status';
    }
  }

  canProceedToNextStep(): boolean {
    if (!this.verificationStatus) return false;

    switch (this.currentStep) {
      case 'document_upload':
        return this.verificationStatus.verification.emailVerified;
      case 'face_comparison':
        return this.verificationStatus.verification.documentsUploaded;
      default:
        return true;
    }
  }
}
