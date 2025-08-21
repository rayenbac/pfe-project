import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VerificationService } from '../../core/services/verification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="email-verification-container">
      <div class="verification-card">
        <div *ngIf="isVerifying" class="verifying">
          <div class="spinner"></div>
          <h2>Verifying Your Email</h2>
          <p>Please wait while we verify your email address...</p>
        </div>

        <div *ngIf="verificationResult === 'success'" class="success">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2>Email Verified Successfully!</h2>
          <p>Your email has been verified. You can now continue with the identity verification process.</p>
          <button class="btn-primary" (click)="continueToVerification()">
            <i class="fas fa-arrow-right"></i>
            Continue Verification
          </button>
        </div>

        <div *ngIf="verificationResult === 'error'" class="error">
          <div class="error-icon">
            <i class="fas fa-times-circle"></i>
          </div>
          <h2>Verification Failed</h2>
          <p>{{ errorMessage }}</p>
          <div class="action-buttons">
            <button class="btn-primary" (click)="goToLogin()">
              <i class="fas fa-sign-in-alt"></i>
              Go to Login
            </button>
            <button class="btn-secondary" (click)="requestNewVerification()">
              <i class="fas fa-envelope"></i>
              Request New Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-verification-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .verification-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 6px solid #f3f3f3;
      border-top: 6px solid #ff5a5f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-icon,
    .error-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .success-icon {
      color: #4CAF50;
    }

    .error-icon {
      color: #f44336;
    }

    h2 {
      color: #333;
      margin-bottom: 15px;
    }

    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
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
      margin: 0 10px;
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
      margin: 0 10px;
    }

    .btn-secondary:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    @media (max-width: 600px) {
      .verification-card {
        padding: 30px 20px;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .btn-primary,
      .btn-secondary {
        margin: 5px 0;
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EmailVerificationComponent implements OnInit {
  isVerifying = true;
  verificationResult: 'success' | 'error' | null = null;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.verifyEmail(token);
    } else {
      this.verificationResult = 'error';
      this.errorMessage = 'Invalid verification link';
      this.isVerifying = false;
    }
  }

  verifyEmail(token: string): void {
    this.verificationService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.verificationResult = 'success';
        Swal.fire('Success', 'Email verified successfully!', 'success');
      },
      error: (error) => {
        this.isVerifying = false;
        this.verificationResult = 'error';
        this.errorMessage = error.error?.message || 'Verification failed. The link may be expired or invalid.';
      }
    });
  }

  continueToVerification(): void {
    this.router.navigate(['/verification']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  requestNewVerification(): void {
    this.router.navigate(['/verification']);
  }
}
