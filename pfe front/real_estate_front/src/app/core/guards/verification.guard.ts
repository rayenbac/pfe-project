import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VerificationService } from '../services/verification.service';
import Swal from 'sweetalert2';

export interface VerificationRequirements {
  emailVerified?: boolean;
  documentsUploaded?: boolean;
  faceVerified?: boolean;
  livenessRequired?: boolean;
  minLivenessChecks?: number;
  requireFreshLiveness?: boolean;
}

export const VerificationPresets = {
  EMAIL_ONLY: {
    emailVerified: true
  },
  BASIC_VERIFICATION: {
    emailVerified: true,
    documentsUploaded: true
  },
  FULL_VERIFICATION: {
    emailVerified: true,
    documentsUploaded: true,
    faceVerified: true
  },
  BOOKING_VERIFICATION: {
    emailVerified: true,
    documentsUploaded: true,
    faceVerified: true,
    livenessRequired: true,
    minLivenessChecks: 1,
    requireFreshLiveness: true
  },
  PAYMENT_VERIFICATION: {
    emailVerified: true,
    documentsUploaded: true,
    faceVerified: true,
    livenessRequired: true,
    minLivenessChecks: 1,
    requireFreshLiveness: false
  }
};

@Injectable({
  providedIn: 'root'
})
export class VerificationGuard implements CanActivate, CanActivateChild {

  constructor(
    private verificationService: VerificationService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAccess(route, state);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAccess(route, state);
  }

  private checkAccess(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const requirements = route.data as VerificationRequirements;
    
    if (!requirements || Object.keys(requirements).length === 0) {
      return of(true);
    }

    return this.checkVerificationRequirements(requirements, state.url);
  }

  private checkVerificationRequirements(requirements: VerificationRequirements, returnUrl?: string): Observable<boolean> {
    return this.verificationService.getVerificationStatus().pipe(
      map(status => {
        if (!status) {
          this.showVerificationRequired();
          this.router.navigate(['/verification']);
          return false;
        }

        // Check email verification
        if (requirements.emailVerified && !status.verification.emailVerified) {
          this.showEmailVerificationRequired();
          this.router.navigate(['/verification']);
          return false;
        }

        // Check document upload
        if (requirements.documentsUploaded && !status.verification.documentsUploaded) {
          this.showDocumentsRequired();
          this.router.navigate(['/verification']);
          return false;
        }

        // Check face verification
        if (requirements.faceVerified && !status.verification.faceVerified) {
          this.showFaceVerificationRequired();
          this.router.navigate(['/verification']);
          return false;
        }

        // Check liveness requirements
        if (requirements.livenessRequired) {
          const minChecks = requirements.minLivenessChecks || 1;
          
          if (!status.livenessCheck || status.livenessCheck.totalChecks < minChecks) {
            this.showLivenessCheckRequired(minChecks);
            this.router.navigate(['/verification']);
            return false;
          }

          if (requirements.requireFreshLiveness) {
            const lastCheck = status.livenessCheck.lastCheck;
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            if (!lastCheck || new Date(lastCheck) < oneDayAgo) {
              this.showFreshLivenessRequired();
              this.router.navigate(['/verification']);
              return false;
            }
          }
        }

        return true;
      }),
      catchError(() => {
        this.showVerificationError();
        this.router.navigate(['/verification']);
        return of(false);
      })
    );
  }

  private showVerificationRequired(): void {
    Swal.fire({
      title: 'Verification Required',
      text: 'Please complete your account verification to continue.',
      icon: 'info',
      confirmButtonText: 'Start Verification'
    });
  }

  private showEmailVerificationRequired(): void {
    Swal.fire({
      title: 'Email Verification Required',
      text: 'Please verify your email address to continue.',
      icon: 'info',
      confirmButtonText: 'Verify Email'
    });
  }

  private showDocumentsRequired(): void {
    Swal.fire({
      title: 'Document Upload Required',
      text: 'Please upload your identity documents to continue.',
      icon: 'info',
      confirmButtonText: 'Upload Documents'
    });
  }

  private showFaceVerificationRequired(): void {
    Swal.fire({
      title: 'Face Verification Required',
      text: 'Please complete face verification to continue.',
      icon: 'info',
      confirmButtonText: 'Verify Face'
    });
  }

  private showLivenessCheckRequired(minChecks: number): void {
    Swal.fire({
      title: 'Liveness Check Required',
      html: `This action requires at least <strong>${minChecks}</strong> liveness verification${minChecks > 1 ? 's' : ''} for security.`,
      icon: 'info',
      confirmButtonText: 'Complete Verification'
    });
  }

  private showFreshLivenessRequired(): void {
    Swal.fire({
      title: 'Fresh Liveness Check Required',
      text: 'A recent liveness check is required for this action. Please complete a new verification.',
      icon: 'info',
      confirmButtonText: 'Complete Verification'
    });
  }

  private showVerificationError(): void {
    Swal.fire({
      title: 'Verification Error',
      text: 'Unable to verify your account status. Please try again.',
      icon: 'error',
      confirmButtonText: 'Retry'
    });
  }
}
