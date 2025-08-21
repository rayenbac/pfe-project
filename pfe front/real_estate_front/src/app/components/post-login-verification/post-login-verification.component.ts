import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { VerificationService } from '../../core/services/verification.service';
import { VerificationWorkflowComponent } from '../../components/verification-workflow/verification-workflow.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-post-login-verification',
  standalone: true,
  imports: [CommonModule, VerificationWorkflowComponent],
  template: `
    <div class="post-login-container">
      <div class="welcome-section" *ngIf="showWelcome">
        <div class="welcome-content">
          <h1>Welcome{{ user?.firstName ? ', ' + user.firstName : '' }}!</h1>
          <p>Your account has been created successfully. To access all platform features, please complete the identity verification process.</p>
          
          <div class="verification-benefits">
            <h3>Why verify your identity?</h3>
            <div class="benefits-grid">
              <div class="benefit-item">
                <i class="fas fa-shield-check"></i>
                <div>
                  <h4>Enhanced Security</h4>
                  <p>Protect your account and transactions</p>
                </div>
              </div>
              <div class="benefit-item">
                <i class="fas fa-handshake"></i>
                <div>
                  <h4>Book Properties</h4>
                  <p>Make reservations and secure bookings</p>
                </div>
              </div>
              <div class="benefit-item">
                <i class="fas fa-comments"></i>
                <div>
                  <h4>Contact Agents</h4>
                  <p>Chat directly with property owners and agents</p>
                </div>
              </div>
              <div class="benefit-item">
                <i class="fas fa-home"></i>
                <div>
                  <h4>List Properties</h4>
                  <p>Post and manage your own property listings</p>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn btn-primary btn-lg" (click)="startVerification()">
              <i class="fas fa-play"></i>
              Start Verification Process
            </button>
            <button class="btn btn-outline-secondary" (click)="skipForNow()">
              Skip for Now
            </button>
          </div>
        </div>
      </div>

      <!-- Verification Workflow -->
      <app-verification-workflow 
        *ngIf="showVerificationWorkflow"
        [showInModal]="false"
        [redirectOnComplete]="true"
        [completionRoute]="'/dashboard'"
        (verificationComplete)="onVerificationComplete($event)"
        (workflowCancelled)="onWorkflowCancelled()">
      </app-verification-workflow>
    </div>
  `,
  styles: [`
    .post-login-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .welcome-section {
      max-width: 800px;
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .welcome-content h1 {
      color: #2c3e50;
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .welcome-content > p {
      color: #6c757d;
      font-size: 1.2rem;
      margin-bottom: 3rem;
      line-height: 1.6;
    }

    .verification-benefits {
      margin-bottom: 3rem;
    }

    .verification-benefits h3 {
      color: #2c3e50;
      font-size: 1.5rem;
      margin-bottom: 2rem;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      text-align: left;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
      transition: transform 0.3s ease;
    }

    .benefit-item:hover {
      transform: translateY(-4px);
    }

    .benefit-item i {
      font-size: 2rem;
      color: #17a2b8;
      margin-top: 0.25rem;
    }

    .benefit-item h4 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }

    .benefit-item p {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 0;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      border-radius: 50px;
      padding: 1rem 2rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-lg {
      font-size: 1.1rem;
      padding: 1.25rem 2.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #17a2b8, #20c997);
      border: none;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #138496, #1fa085);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .btn-outline-secondary {
      color: #6c757d;
      border: 2px solid #6c757d;
      background: transparent;
    }

    .btn-outline-secondary:hover {
      background: #6c757d;
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .post-login-container {
        padding: 1rem;
      }

      .welcome-section {
        padding: 2rem;
      }

      .welcome-content h1 {
        font-size: 2rem;
      }

      .benefits-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class PostLoginVerificationComponent implements OnInit {
  user: any = null;
  showWelcome = true;
  showVerificationWorkflow = false;

  constructor(
    private authService: AuthService,
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    // Check if user is already verified
    this.checkExistingVerificationStatus();
  }

  private checkExistingVerificationStatus(): void {
    this.verificationService.getVerificationStatus().subscribe({
      next: (status) => {
        // If user is already verified, redirect to dashboard
        if (status.verification.status === 'verified') {
          this.router.navigate(['/dashboard']);
          return;
        }

        // If verification is in progress, go straight to workflow
        if (status.verification.status !== 'unverified') {
          this.showWelcome = false;
          this.showVerificationWorkflow = true;
        }
      },
      error: (error) => {
        console.error('Failed to check verification status:', error);
        // Continue with welcome screen
      }
    });
  }

  startVerification(): void {
    this.showWelcome = false;
    this.showVerificationWorkflow = true;
  }

  skipForNow(): void {
    Swal.fire({
      title: 'Skip Verification?',
      text: 'You can complete verification later from your profile, but some features will be limited.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Skip for Now',
      cancelButtonText: 'Start Verification',
      confirmButtonColor: '#6c757d',
      cancelButtonColor: '#17a2b8'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onVerificationComplete(status: any): void {
    Swal.fire({
      title: 'Verification Complete!',
      text: 'Welcome to the platform! You now have access to all features.',
      icon: 'success',
      confirmButtonText: 'Continue to Dashboard',
      confirmButtonColor: '#28a745'
    }).then(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  onWorkflowCancelled(): void {
    this.showVerificationWorkflow = false;
    this.showWelcome = true;
  }
}
