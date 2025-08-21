import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../services/auth.service';
import { VerificationService } from '../services/verification.service';

interface ApiResponse {
  requiresVerification?: boolean;
  verificationStep?: string;
  message?: string;
}

@Injectable()
export class VerificationInterceptor implements HttpInterceptor {
  private verificationRequiredRoutes = [
    '/booking',
    '/chat',
    '/post',
    '/contract',
    '/property/create',
    '/property/edit',
    '/agency/create',
    '/agency/edit'
  ];

  constructor(
    private authService: AuthService,
    private verificationService: VerificationService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const response = event.body as ApiResponse;
          
          // Check if API response indicates verification is required
          if (response && response.requiresVerification) {
            this.handleVerificationRequired(response);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Handle verification-related errors
        if (error.status === 403 && error.error?.requiresVerification) {
          this.handleVerificationRequired(error.error);
          return throwError(() => error);
        }
        
        // Handle verification step errors
        if (error.status === 400 && error.error?.verificationStep) {
          this.showVerificationStepError(error.error);
          return throwError(() => error);
        }

        return throwError(() => error);
      })
    );
  }

  private handleVerificationRequired(response: ApiResponse): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    const message = response.message || 'This action requires identity verification.';
    const verificationStep = response.verificationStep || 'email_verification';

    Swal.fire({
      title: 'Verification Required',
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Start Verification',
      cancelButtonText: 'Later',
      confirmButtonColor: '#17a2b8',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.redirectToVerification(verificationStep);
      }
    });
  }

  private showVerificationStepError(error: ApiResponse): void {
    const stepMessages: { [key: string]: string } = {
      email_verification: 'Please verify your email address first.',
      document_upload: 'Please upload your identity documents.',
      face_verification: 'Please complete face verification.',
      liveness_check: 'A recent liveness check is required for this action.'
    };

    const message = stepMessages[error.verificationStep || ''] || error.message || 'Verification step required.';

    Swal.fire({
      title: 'Verification Step Required',
      text: message,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Complete Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#17a2b8'
    }).then((result) => {
      if (result.isConfirmed) {
        this.redirectToVerification(error.verificationStep || 'email_verification');
      }
    });
  }

  private redirectToVerification(step: string): void {
    // Refresh verification status first
    this.verificationService.loadVerificationStatus();
    
    // Navigate to verification page
    this.router.navigate(['/verification'], { 
      queryParams: { step } 
    });
  }
}
