import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VerificationService } from '../../core/services/verification.service';
import { AuthService } from '../../core/services/auth.service';
import { VerificationStatusResponse } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification-status-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verification-widget" *ngIf="isAuthenticated && verificationStatus">
      <!-- Fully Verified Badge -->
      <div class="verification-badge verified" 
           *ngIf="isFullyVerified()"
           (click)="openVerificationDetails()">
        <i class="fas fa-shield-check"></i>
        <span>Verified</span>
      </div>

      <!-- Pending Verification Badge -->
      <div class="verification-badge pending" 
           *ngIf="!isFullyVerified() && hasStartedVerification()"
           (click)="continueVerification()">
        <i class="fas fa-clock"></i>
        <span>{{ getVerificationProgress() }}% Complete</span>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="getVerificationProgress()"></div>
        </div>
      </div>

      <!-- Not Started Badge -->
      <div class="verification-badge not-started" 
           *ngIf="!hasStartedVerification()"
           (click)="startVerification()">
        <i class="fas fa-exclamation-circle"></i>
        <span>Verify Identity</span>
      </div>

      <!-- Verification Required Warning -->
      <div class="verification-warning" 
           *ngIf="showWarning && !isFullyVerified()">
        <i class="fas fa-info-circle"></i>
        <span>Complete verification to access all features</span>
        <button class="btn-link" (click)="continueVerification()">
          Continue <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .verification-widget {
      position: relative;
    }

    .verification-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
    }

    .verification-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .verification-badge.verified {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
    }

    .verification-badge.pending {
      background: linear-gradient(135deg, #ffc107, #fd7e14);
      color: white;
      flex-direction: column;
      align-items: flex-start;
      padding: 0.75rem 1rem;
    }

    .verification-badge.not-started {
      background: linear-gradient(135deg, #dc3545, #c0392b);
      color: white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      margin-top: 0.25rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: white;
      transition: width 0.3s ease;
    }

    .verification-warning {
      position: absolute;
      top: 100%;
      right: 0;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      z-index: 1000;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .verification-warning::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 20px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #ffeaa7;
    }

    .btn-link {
      background: none;
      border: none;
      color: #856404;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.9rem;
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-link:hover {
      color: #533f03;
    }

    @media (max-width: 768px) {
      .verification-badge {
        font-size: 0.75rem;
        padding: 0.4rem 0.8rem;
      }

      .verification-warning {
        min-width: 250px;
        right: -50px;
      }

      .verification-warning::before {
        right: 60px;
      }
    }
  `]
})
export class VerificationStatusWidgetComponent implements OnInit, OnDestroy {
  verificationStatus: VerificationStatusResponse | null = null;
  isAuthenticated = false;
  showWarning = false;
  private subscription = new Subscription();

  constructor(
    private verificationService: VerificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.loadVerificationStatus();
      this.subscribeToStatusUpdates();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadVerificationStatus(): void {
    this.subscription.add(
      this.verificationService.getVerificationStatus().subscribe({
        next: (status) => {
          this.verificationStatus = status;
          this.checkWarningDisplay();
        },
        error: (error) => {
          console.error('Failed to load verification status:', error);
        }
      })
    );
  }

  private subscribeToStatusUpdates(): void {
    this.subscription.add(
      this.verificationService.verificationStatus$.subscribe(status => {
        if (status) {
          this.verificationStatus = status;
          this.checkWarningDisplay();
        }
      })
    );
  }

  private checkWarningDisplay(): void {
    // Show warning if user is not verified and hasn't seen it recently
    const lastWarningDismissed = localStorage.getItem('verification-warning-dismissed');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.showWarning = !this.isFullyVerified() && 
                      (!lastWarningDismissed || parseInt(lastWarningDismissed) < oneDayAgo);
  }

  isFullyVerified(): boolean {
    return this.verificationStatus?.verification.status === 'verified';
  }

  hasStartedVerification(): boolean {
    if (!this.verificationStatus) return false;
    return this.verificationStatus.verification.status !== 'unverified';
  }

  getVerificationProgress(): number {
    if (!this.verificationStatus) return 0;

    const verification = this.verificationStatus.verification;
    let progress = 0;

    if (verification.emailVerified) progress += 33;
    if (verification.documentsUploaded) progress += 33;
    if (verification.faceVerified) progress += 34;

    return Math.min(progress, 100);
  }

  startVerification(): void {
    this.dismissWarning();
    this.router.navigate(['/verification']);
  }

  continueVerification(): void {
    this.dismissWarning();
    this.router.navigate(['/verification']);
  }

  openVerificationDetails(): void {
    this.router.navigate(['/profile/verification']);
  }

  private dismissWarning(): void {
    this.showWarning = false;
    localStorage.setItem('verification-warning-dismissed', Date.now().toString());
  }
}
