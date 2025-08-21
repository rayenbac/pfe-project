import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { VerificationService } from '../../core/services/verification.service';
import { FaceDetectionService } from '../../core/services/face-detection.service';
import { VerificationStatusResponse } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('idImageElement', { static: false }) idImageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('selfieImageElement', { static: false }) selfieImageElement!: ElementRef<HTMLImageElement>;

  verificationStatus: VerificationStatusResponse | null = null;
  currentStep: string = 'email_verification';
  isLoading = false;
  stream: MediaStream | null = null;
  
  // File uploads
  idDocumentFile: File | null = null;
  selfieFile: File | null = null;
  idImagePreview: string | null = null;
  selfiePreview: string | null = null;

  // Face comparison
  faceComparisonInProgress = false;
  faceComparisonResult: any = null;

  // Liveness detection
  livenessCheckInProgress = false;
  currentLivenessAction: 'blink' | 'smile' | 'turn_left' | 'turn_right' | null = null;
  livenessActions: ('blink' | 'smile' | 'turn_left' | 'turn_right')[] = ['blink', 'smile', 'turn_left', 'turn_right'];
  completedActions: string[] = [];
  livenessCheckStarted = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private verificationService: VerificationService,
    private faceDetectionService: FaceDetectionService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadVerificationStatus();
    this.subscription.add(
      this.verificationService.verificationStatus$.subscribe(status => {
        this.verificationStatus = status;
        this.updateCurrentStep();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.stopCamera();
  }

  loadVerificationStatus(): void {
    this.isLoading = true;
    this.verificationService.getVerificationStatus().subscribe({
      next: (status) => {
        this.verificationStatus = status;
        this.updateCurrentStep();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading verification status:', error);
        this.isLoading = false;
        Swal.fire('Error', 'Failed to load verification status', 'error');
      }
    });
  }

  updateCurrentStep(): void {
    if (!this.verificationStatus) return;
    this.currentStep = this.verificationService.getNextVerificationStep();
    console.log('Current verification status:', this.verificationStatus);
    console.log('Current step updated to:', this.currentStep);
  }

  // Email verification step
  sendEmailVerification(): void {
    this.isLoading = true;
    this.verificationService.sendEmailVerification().subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire('Success', 'Verification email sent! Please check your email.', 'success');
        this.loadVerificationStatus();
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', error.error?.message || 'Failed to send verification email', 'error');
      }
    });
  }

  // Document upload step
  onIdDocumentSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.idDocumentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.idImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSelfieSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selfieFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selfiePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadDocuments(): void {
    if (!this.idDocumentFile || !this.selfieFile) {
      Swal.fire('Error', 'Please select both ID document and selfie images', 'error');
      return;
    }

    this.isLoading = true;
    this.verificationService.uploadDocuments(this.idDocumentFile, this.selfieFile).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire('Success', 'Documents uploaded successfully!', 'success');
        this.loadVerificationStatus();
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire('Error', error.error?.message || 'Failed to upload documents', 'error');
      }
    });
  }

  // Face comparison step
  async performFaceComparison(): Promise<void> {
    if (!this.idImagePreview || !this.selfiePreview) {
      Swal.fire('Error', 'ID document and selfie images are required for face comparison', 'error');
      return;
    }

    this.faceComparisonInProgress = true;

    try {
      // Wait for face detection models to load
      const modelsLoaded = await this.faceDetectionService.waitForModels();
      if (!modelsLoaded) {
        throw new Error('Face detection models failed to load');
      }

      // Load images
      const idImage = await this.loadImage(this.idImagePreview);
      const selfieImage = await this.loadImage(this.selfiePreview);

      // Compare faces
      const comparisonResult = await this.faceDetectionService.compareFaces(idImage, selfieImage);

      if (!comparisonResult) {
        throw new Error('Could not detect faces in one or both images');
      }

      const { similarity } = comparisonResult;
      const threshold = 0.7; // 70% similarity threshold
      const passed = similarity >= threshold;

      // Submit result to backend
      this.verificationService.submitFaceComparison(
        similarity,
        passed ? 'passed' : 'failed'
      ).subscribe({
        next: (response) => {
          this.faceComparisonResult = response;
          this.faceComparisonInProgress = false;
          
          if (response.verified) {
            Swal.fire('Success', 'Face verification completed successfully!', 'success');
          } else {
            Swal.fire('Failed', 'Face verification failed. Please try again with clearer photos.', 'error');
          }
          
          this.loadVerificationStatus();
        },
        error: (error) => {
          this.faceComparisonInProgress = false;
          Swal.fire('Error', error.error?.message || 'Face comparison failed', 'error');
        }
      });

    } catch (error) {
      this.faceComparisonInProgress = false;
      console.error('Face comparison error:', error);
      Swal.fire('Error', 'Face comparison failed. Please try again.', 'error');
    }
  }

  // Liveness detection step
  async startLivenessCheck(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.livenessCheckStarted = true;
        this.startNextLivenessAction();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Swal.fire('Error', 'Could not access camera. Please allow camera permissions.', 'error');
    }
  }

  startNextLivenessAction(): void {
    const remainingActions = this.livenessActions.filter(action => !this.completedActions.includes(action));
    
    if (remainingActions.length === 0) {
      this.completeLivenessCheck();
      return;
    }

    this.currentLivenessAction = remainingActions[Math.floor(Math.random() * remainingActions.length)];
    this.performLivenessAction();
  }

  async performLivenessAction(): Promise<void> {
    if (!this.currentLivenessAction || !this.videoElement) return;

    this.livenessCheckInProgress = true;

    // Wait for user to perform action (5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const result = await this.faceDetectionService.performLivenessCheck(
        this.videoElement.nativeElement,
        this.currentLivenessAction
      );

      // Record the liveness check
      this.verificationService.recordLivenessCheck(
        this.currentLivenessAction,
        result.success ? 'passed' : 'failed',
        result.confidence
      ).subscribe({
        next: (response) => {
          if (result.success) {
            this.completedActions.push(this.currentLivenessAction!);
            Swal.fire('Good!', result.message, 'success');
            setTimeout(() => this.startNextLivenessAction(), 1000);
          } else {
            Swal.fire('Try Again', result.message, 'warning');
            setTimeout(() => this.performLivenessAction(), 2000);
          }
          this.livenessCheckInProgress = false;
        },
        error: (error) => {
          this.livenessCheckInProgress = false;
          Swal.fire('Error', 'Failed to record liveness check', 'error');
        }
      });

    } catch (error) {
      this.livenessCheckInProgress = false;
      console.error('Liveness check error:', error);
      Swal.fire('Error', 'Liveness check failed. Please try again.', 'error');
    }
  }

  completeLivenessCheck(): void {
    this.stopCamera();
    Swal.fire('Excellent!', 'Liveness check completed successfully! You can now make bookings.', 'success');
    this.loadVerificationStatus();
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.livenessCheckStarted = false;
    this.currentLivenessAction = null;
    this.livenessCheckInProgress = false;
  }

  // Utility methods
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  getVerificationProgress(): number {
    return this.verificationService.getVerificationProgress();
  }

  retryStep(step: 'email' | 'documents' | 'face'): void {
    Swal.fire({
      title: 'Retry Verification',
      text: `Are you sure you want to retry the ${step} step?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, retry'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.verificationService.retryVerification(step).subscribe({
          next: (response) => {
            this.isLoading = false;
            Swal.fire('Success', response.message, 'success');
            this.loadVerificationStatus();
            // Reset relevant data
            if (step === 'documents') {
              this.idDocumentFile = null;
              this.selfieFile = null;
              this.idImagePreview = null;
              this.selfiePreview = null;
              this.faceComparisonResult = null;
            }
          },
          error: (error) => {
            this.isLoading = false;
            Swal.fire('Error', error.error?.message || 'Retry failed', 'error');
          }
        });
      }
    });
  }

  getActionDisplayName(action: string): string {
    switch (action) {
      case 'blink': return 'Blink your eyes';
      case 'smile': return 'Smile';
      case 'turn_left': return 'Turn your head left';
      case 'turn_right': return 'Turn your head right';
      default: return action;
    }
  }
}
