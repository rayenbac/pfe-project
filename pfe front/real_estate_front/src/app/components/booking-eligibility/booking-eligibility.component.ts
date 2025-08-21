import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VerificationService } from '../../core/services/verification.service';
import { BookingEligibility } from '../../core/models/verification.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-booking-eligibility',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="booking-eligibility-container" *ngIf="!isEligible">
      <div class="eligibility-card">
        <div class="warning-icon">
          <i class="fas fa-shield-alt"></i>
        </div>
        
        <h3>Verification Required</h3>
        <p>To ensure secure transactions, please complete the following steps before booking:</p>
        
        <div class="requirements-list">
          <div class="requirement-item" [class.completed]="eligibility?.requirements?.emailVerified || false">
            <i [class]="(eligibility?.requirements?.emailVerified || false) ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Email Verification</span>
          </div>
          
          <div class="requirement-item" [class.completed]="eligibility?.requirements?.documentsUploaded || false">
            <i [class]="(eligibility?.requirements?.documentsUploaded || false) ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Identity Documents</span>
          </div>
          
          <div class="requirement-item" [class.completed]="eligibility?.requirements?.faceVerified || false">
            <i [class]="(eligibility?.requirements?.faceVerified || false) ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Face Verification</span>
          </div>
          
          <div class="requirement-item" [class.completed]="!(eligibility?.requirements?.livenessCheckRequired || true)">
            <i [class]="!(eligibility?.requirements?.livenessCheckRequired || true) ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
            <span>Liveness Check</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="btn-primary" (click)="startVerification()">
            <i class="fas fa-shield-alt"></i>
            Start Verification
          </button>
          
          <button class="btn-secondary" (click)="onCancel()">
            <i class="fas fa-arrow-left"></i>
            Back to Properties
          </button>
        </div>
        
        <div class="security-note">
          <i class="fas fa-info-circle"></i>
          <p>This verification process helps protect both tenants and property owners by ensuring secure and trusted transactions.</p>
        </div>
      </div>
    </div>
    
    <!-- Quick liveness check for verified users -->
    <div class="quick-liveness-container" *ngIf="isEligible && needsLivenessCheck">
      <div class="liveness-card">
        <div class="liveness-icon">
          <i class="fas fa-video"></i>
        </div>
        
        <h4>Quick Security Check</h4>
        <p>Please complete a quick liveness check before proceeding with your booking.</p>
        
        <button class="btn-primary" (click)="startQuickLivenessCheck()">
          <i class="fas fa-camera"></i>
          Start Check (30 seconds)
        </button>
      </div>
    </div>
  `,
  styles: [`
    .booking-eligibility-container,
    .quick-liveness-container {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #ff5a5f;
    }

    .eligibility-card,
    .liveness-card {
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }

    .warning-icon,
    .liveness-icon {
      font-size: 3rem;
      color: #ff5a5f;
      margin-bottom: 20px;
    }

    h3 {
      color: #333;
      margin-bottom: 15px;
    }

    h4 {
      color: #333;
      margin-bottom: 10px;
    }

    p {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .requirements-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 25px 0;
      text-align: left;
    }

    .requirement-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .requirement-item.completed {
      background: #f8fff8;
      border-color: #4CAF50;
    }

    .requirement-item i {
      color: #ccc;
      font-size: 1.2rem;
      width: 20px;
    }

    .requirement-item.completed i {
      color: #4CAF50;
    }

    .requirement-item span {
      color: #666;
      font-weight: 500;
    }

    .requirement-item.completed span {
      color: #333;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin: 25px 0;
      flex-wrap: wrap;
    }

    .btn-primary {
      background: linear-gradient(135deg, #ff5a5f 0%, #ff8e91 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 90, 95, 0.3);
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #333;
      border: 2px solid #dee2e6;
      padding: 10px 22px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }

    .security-note {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .security-note i {
      color: #2196F3;
      margin-top: 2px;
    }

    .security-note p {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
      text-align: left;
    }

    .liveness-card {
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #ff5a5f;
    }

    @media (max-width: 600px) {
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class BookingEligibilityComponent implements OnInit {
  @Input() propertyId?: string;
  @Output() eligibilityChanged = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();

  eligibility: BookingEligibility | null = null;
  isEligible = false;
  needsLivenessCheck = false;
  isLoading = true;

  constructor(
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkEligibility();
  }

  checkEligibility(): void {
    this.verificationService.checkBookingEligibility().subscribe({
      next: (eligibility) => {
        this.eligibility = eligibility;
        this.isEligible = eligibility.canBook;
        this.needsLivenessCheck = eligibility.verified && eligibility.requirements.livenessCheckRequired;
        this.isLoading = false;
        this.eligibilityChanged.emit(this.isEligible && !this.needsLivenessCheck);
      },
      error: (error) => {
        console.error('Error checking booking eligibility:', error);
        this.isEligible = false;
        this.isLoading = false;
        this.eligibilityChanged.emit(false);
      }
    });
  }

  startVerification(): void {
    this.router.navigate(['/verification']);
  }

  startQuickLivenessCheck(): void {
    this.router.navigate(['/verification'], { 
      fragment: 'liveness-check',
      queryParams: { returnTo: this.router.url }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
