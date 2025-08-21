import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VerificationService } from '../../core/services/verification.service';
import { VerificationStatusComponent } from '../verification-status/verification-status.component';
import { VerificationStatusResponse } from '../../core/models/verification.model';

@Component({
  selector: 'app-verification-demo',
  standalone: true,
  imports: [CommonModule, VerificationStatusComponent],
  template: `
    <div class="verification-demo">
      <div class="header">
        <h1>Identity Verification System Demo</h1>
        <p>Complete real estate platform with comprehensive identity verification</p>
      </div>

      <!-- Verification Status Widget -->
      <app-verification-status></app-verification-status>

      <div class="demo-container">
        <!-- Current Status Section -->
        <div class="section">
          <h2>Current Verification Status</h2>
          <div class="status-card" *ngIf="verificationStatus">
            <div class="status-overview">
              <div class="status-badge" [class]="getStatusClass()">
                <i [class]="getStatusIcon()"></i>
                <span>{{ getStatusText() }}</span>
              </div>
              <div class="progress-info">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="getProgress()"></div>
                </div>
                <span>{{ getProgress() }}% Complete</span>
              </div>
            </div>

            <div class="status-details">
              <div class="detail-item" [class.completed]="verificationStatus.verification.emailVerified">
                <i [class]="verificationStatus.verification.emailVerified ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Email Verified</span>
              </div>
              <div class="detail-item" [class.completed]="verificationStatus.verification.documentsUploaded">
                <i [class]="verificationStatus.verification.documentsUploaded ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Documents Uploaded</span>
              </div>
              <div class="detail-item" [class.completed]="verificationStatus.verification.faceVerified">
                <i [class]="verificationStatus.verification.faceVerified ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Face Verified</span>
              </div>
              <div class="detail-item" [class.completed]="verificationStatus.livenessCheck.totalChecks > 0">
                <i [class]="verificationStatus.livenessCheck.totalChecks > 0 ? 'fas fa-check-circle' : 'fas fa-circle'"></i>
                <span>Liveness Check ({{ verificationStatus.livenessCheck.totalChecks }} completed)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Demo Actions Section -->
        <div class="section">
          <h2>Demo Actions</h2>
          <div class="demo-actions">
            <div class="action-group">
              <h3>Verification Steps</h3>
              <button class="demo-btn primary" (click)="startVerification()">
                <i class="fas fa-shield-alt"></i>
                Start Verification Process
              </button>
              <button class="demo-btn secondary" (click)="verifyEmail()">
                <i class="fas fa-envelope"></i>
                Email Verification
              </button>
              <button class="demo-btn secondary" (click)="checkBookingEligibility()">
                <i class="fas fa-calendar-check"></i>
                Check Booking Eligibility
              </button>
            </div>

            <div class="action-group">
              <h3>Protected Routes Demo</h3>
              <button class="demo-btn info" (click)="testEmailRoute()">
                <i class="fas fa-lock"></i>
                Email Required Route
              </button>
              <button class="demo-btn info" (click)="testBasicRoute()">
                <i class="fas fa-lock"></i>
                Basic Verification Route
              </button>
              <button class="demo-btn info" (click)="testFullRoute()">
                <i class="fas fa-lock"></i>
                Full Verification Route
              </button>
              <button class="demo-btn warning" (click)="testBookingRoute()">
                <i class="fas fa-home"></i>
                Booking Route (High Security)
              </button>
            </div>

            <div class="action-group">
              <h3>System Reset</h3>
              <button class="demo-btn danger" (click)="resetDemo()">
                <i class="fas fa-redo"></i>
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="section">
          <h2>System Features</h2>
          <div class="features-grid">
            <div class="feature-card">
              <i class="fas fa-envelope-check"></i>
              <h4>Email Verification</h4>
              <p>Secure email verification with token-based validation</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-id-card"></i>
              <h4>Document Upload</h4>
              <p>Secure ID and selfie upload with file validation</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-user-check"></i>
              <h4>Face Recognition</h4>
              <p>Client-side face comparison using face-api.js</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-eye"></i>
              <h4>Liveness Detection</h4>
              <p>Real-time liveness checks for enhanced security</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-shield-alt"></i>
              <h4>Route Protection</h4>
              <p>Granular access control based on verification level</p>
            </div>
            <div class="feature-card">
              <i class="fas fa-bell"></i>
              <h4>Status Tracking</h4>
              <p>Real-time verification status updates</p>
            </div>
          </div>
        </div>

        <!-- Technical Details Section -->
        <div class="section">
          <h2>Technical Implementation</h2>
          <div class="tech-details">
            <div class="tech-item">
              <strong>Backend:</strong> Express.js + TypeScript + MongoDB
            </div>
            <div class="tech-item">
              <strong>Frontend:</strong> Angular 18 + Standalone Components
            </div>
            <div class="tech-item">
              <strong>Face Recognition:</strong> face-api.js (Client-side)
            </div>
            <div class="tech-item">
              <strong>Security:</strong> JWT Authentication + Route Guards
            </div>
            <div class="tech-item">
              <strong>File Upload:</strong> Multer + Secure Storage
            </div>
            <div class="tech-item">
              <strong>Email:</strong> Nodemailer SMTP Integration
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-demo {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .section h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .status-card {
      border: 2px solid #f0f0f0;
      border-radius: 12px;
      padding: 20px;
      background: #fafafa;
    }

    .status-overview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 25px;
      font-weight: 600;
    }

    .status-badge.verified {
      background: #e8f5e8;
      color: #4CAF50;
      border: 2px solid #4CAF50;
    }

    .status-badge.pending {
      background: #fff3e0;
      color: #ff9800;
      border: 2px solid #ff9800;
    }

    .status-badge.failed {
      background: #ffebee;
      color: #f44336;
      border: 2px solid #f44336;
    }

    .progress-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-bar {
      width: 200px;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }

    .status-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      background: white;
    }

    .detail-item.completed {
      background: #f8fff8;
    }

    .detail-item i {
      color: #ccc;
    }

    .detail-item.completed i {
      color: #4CAF50;
    }

    .demo-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }

    .action-group h3 {
      color: #555;
      margin-bottom: 15px;
      font-size: 1.2rem;
    }

    .demo-btn {
      width: 100%;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .demo-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .demo-btn.secondary {
      background: #f8f9fa;
      color: #333;
      border: 2px solid #e9ecef;
    }

    .demo-btn.info {
      background: #e3f2fd;
      color: #1976d2;
      border: 2px solid #bbdefb;
    }

    .demo-btn.warning {
      background: #fff3e0;
      color: #f57c00;
      border: 2px solid #ffcc02;
    }

    .demo-btn.danger {
      background: #ffebee;
      color: #d32f2f;
      border: 2px solid #ffcdd2;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .feature-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .feature-card i {
      font-size: 2rem;
      color: #667eea;
      margin-bottom: 15px;
    }

    .feature-card h4 {
      color: #333;
      margin-bottom: 10px;
    }

    .feature-card p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .tech-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .tech-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .tech-item strong {
      color: #333;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 2rem;
      }

      .demo-actions {
        grid-template-columns: 1fr;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .tech-details {
        grid-template-columns: 1fr;
      }

      .status-overview {
        flex-direction: column;
        gap: 15px;
      }

      .progress-bar {
        width: 100%;
      }
    }
  `]
})
export class VerificationDemoComponent implements OnInit {
  verificationStatus: VerificationStatusResponse | null = null;

  constructor(
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadVerificationStatus();
  }

  private loadVerificationStatus(): void {
    this.verificationService.getVerificationStatus().subscribe({
      next: (status) => {
        this.verificationStatus = status;
      },
      error: (error) => {
        console.error('Error loading verification status:', error);
      }
    });
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
        return 'fas fa-shield-check';
      case 'failed':
        return 'fas fa-shield-times';
      default:
        return 'fas fa-shield-alt';
    }
  }

  getStatusText(): string {
    if (!this.verificationStatus) return 'Loading...';
    
    switch (this.verificationStatus.verification.status) {
      case 'verified':
        return 'Fully Verified';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'In Progress';
    }
  }

  getProgress(): number {
    return this.verificationService.getVerificationProgress();
  }

  startVerification(): void {
    this.router.navigate(['/verification']);
  }

  verifyEmail(): void {
    this.router.navigate(['/verification/email']);
  }

  checkBookingEligibility(): void {
    this.verificationService.checkBookingEligibility().subscribe({
      next: (eligibility) => {
        const status = eligibility.canBook ? 'success' : 'warning';
        const title = eligibility.canBook ? 'Booking Eligible' : 'Additional Verification Required';
        
        // Show eligibility result
        console.log('Booking eligibility:', eligibility);
      },
      error: (error) => {
        console.error('Error checking booking eligibility:', error);
      }
    });
  }

  testEmailRoute(): void {
    this.router.navigate(['/demo/email-required']);
  }

  testBasicRoute(): void {
    this.router.navigate(['/demo/basic-verification']);
  }

  testFullRoute(): void {
    this.router.navigate(['/demo/full-verification']);
  }

  testBookingRoute(): void {
    this.router.navigate(['/demo/booking-verification']);
  }

  resetDemo(): void {
    // This would reset demo data - implement based on your needs
    console.log('Demo reset requested');
    this.loadVerificationStatus();
  }
}
