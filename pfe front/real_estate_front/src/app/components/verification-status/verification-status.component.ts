import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VerificationService } from '../../core/services/verification.service';
import { VerificationStatusResponse } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verification-status" *ngIf="verificationStatus">
      <!-- Compact status indicator -->
      <div class="status-indicator compact" *ngIf="!expanded">
        <div class="status-badge" [class]="getStatusClass()" (click)="toggleExpanded()">
          <i [class]="getStatusIcon()"></i>
          <span>{{ getStatusText() }}</span>
          <i class="fas fa-chevron-down expand-icon" [class.rotated]="expanded"></i>
        </div>
      </div>

      <!-- Expanded status details -->
      <div class="status-details" *ngIf="expanded">
        <div class="status-header">
          <h4>Verification Status</h4>
          <button class="close-btn" (click)="toggleExpanded()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgress()"></div>
          </div>
          <span class="progress-text">{{ getProgress() }}% Complete</span>
        </div>

        <div class="status-items">
          <div class="status-item" [class.completed]="verificationStatus.verification.emailVerified">
            <i [class]="verificationStatus.verification.emailVerified ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Email Verified</span>
          </div>
          
          <div class="status-item" [class.completed]="verificationStatus.verification.documentsUploaded">
            <i [class]="verificationStatus.verification.documentsUploaded ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Documents Uploaded</span>
          </div>
          
          <div class="status-item" [class.completed]="verificationStatus.verification.faceVerified">
            <i [class]="verificationStatus.verification.faceVerified ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Face Verified</span>
          </div>
          
          <div class="status-item" [class.completed]="verificationStatus.livenessCheck.totalChecks > 0">
            <i [class]="verificationStatus.livenessCheck.totalChecks > 0 ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Liveness Check</span>
          </div>
        </div>

        <div class="action-section" *ngIf="verificationStatus.verification.status !== 'verified'">
          <button class="btn-complete" (click)="navigateToVerification()">
            Complete Verification
          </button>
        </div>

        <div class="verified-section" *ngIf="verificationStatus.verification.status === 'verified'">
          <div class="verified-badge">
            <i class="fas fa-shield-alt"></i>
            <span>Fully Verified</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-status {
      position: relative;
      z-index: 1000;
    }

    .status-indicator.compact {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1001;
    }

    .status-badge {
      background: white;
      border: 2px solid #ff5a5f;
      border-radius: 25px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .status-badge:hover {
      box-shadow: 0 4px 15px rgba(255, 90, 95, 0.3);
      transform: translateY(-2px);
    }

    .status-badge.verified {
      border-color: #4CAF50;
      background: #f8fff8;
    }

    .status-badge.pending {
      border-color: #ff9800;
      background: #fff8e1;
    }

    .status-badge.failed {
      border-color: #f44336;
      background: #ffebee;
    }

    .expand-icon {
      font-size: 0.8rem;
      transition: transform 0.3s ease;
    }

    .expand-icon.rotated {
      transform: rotate(180deg);
    }

    .status-details {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 350px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      padding: 20px;
      border: 1px solid #e0e0e0;
      z-index: 1002;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
    }

    .status-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      font-size: 1.2rem;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #666;
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background-color: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff5a5f, #ff8e91);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      color: #666;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: 6px;
      background: #f8f9fa;
    }

    .status-item.completed {
      background: #f8fff8;
    }

    .status-item i {
      color: #ccc;
      font-size: 1rem;
    }

    .status-item.completed i {
      color: #4CAF50;
    }

    .status-item span {
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .status-item.completed span {
      color: #333;
    }

    .btn-complete {
      width: 100%;
      background: linear-gradient(135deg, #ff5a5f 0%, #ff8e91 100%);
      color: white;
      border: none;
      padding: 12px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-complete:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
    }

    .verified-section {
      text-align: center;
    }

    .verified-badge {
      background: #f8fff8;
      border: 2px solid #4CAF50;
      border-radius: 25px;
      padding: 10px 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #4CAF50;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .status-indicator.compact {
        position: relative;
        top: auto;
        right: auto;
        margin: 10px 0;
      }

      .status-details {
        position: relative;
        top: auto;
        right: auto;
        width: 100%;
        margin: 10px 0;
      }
    }
  `]
})
export class VerificationStatusComponent implements OnInit, OnDestroy {
  verificationStatus: VerificationStatusResponse | null = null;
  expanded = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.verificationService.verificationStatus$.subscribe(status => {
        this.verificationStatus = status;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  getStatusClass(): string {
    if (!this.verificationStatus) return 'pending';
    
    switch (this.verificationStatus.verification.status) {
      case 'verified':
        return 'verified';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  getStatusIcon(): string {
    if (!this.verificationStatus) return 'fas fa-shield-alt';
    
    switch (this.verificationStatus.verification.status) {
      case 'verified':
        return 'fas fa-shield-alt';
      case 'failed':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-shield-alt';
    }
  }

  getStatusText(): string {
    if (!this.verificationStatus) return 'Verification';
    
    switch (this.verificationStatus.verification.status) {
      case 'verified':
        return 'Verified';
      case 'failed':
        return 'Verification Failed';
      case 'unverified':
        return 'Not Verified';
      case 'email_pending':
        return 'Check Email';
      case 'email_verified':
        return 'Upload Documents';
      case 'documents_uploaded':
        return 'Face Check';
      case 'face_verified':
        return 'Almost Done';
      default:
        return 'In Progress';
    }
  }

  getProgress(): number {
    return this.verificationService.getVerificationProgress();
  }

  navigateToVerification(): void {
    this.router.navigate(['/verification']);
    this.expanded = false;
  }
}
