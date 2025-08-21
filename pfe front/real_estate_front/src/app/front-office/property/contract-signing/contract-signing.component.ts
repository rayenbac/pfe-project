import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SignatureService, ContractSigningInfo, SignatureData } from '../../../core/services/signature.service';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [CommonModule, RouterModule, SignaturePadComponent],
  template: `
    <div class="contract-signing-container">
      <div class="contract-header">
        <h2>Contract Signing</h2>
        <p>Please review the contract and provide your signature to proceed with payment.</p>
      </div>

      <!-- Contract Display -->
      <div class="contract-content" *ngIf="contractInfo">
        <div class="contract-details">
          <h3>Property Rental Agreement</h3>
          <div class="contract-text">
            <p><strong>Property:</strong> {{ contractInfo.contract.propertyTitle }}</p>
            <p><strong>Check-in:</strong> {{ contractInfo.contract.checkInDate | date }}</p>
            <p><strong>Check-out:</strong> {{ contractInfo.contract.checkOutDate | date }}</p>
            <p><strong>Total Amount:</strong> {{ contractInfo.contract.totalAmount | currency }}</p>
            <p><strong>Agent:</strong> {{ contractInfo.contract.agentName }}</p>
            <p><strong>Client:</strong> {{ contractInfo.contract.clientName }}</p>
          </div>
        </div>

        <!-- Signature Status -->
        <div class="signature-status">
          <div class="signature-item" [class.completed]="contractInfo.agentSigned">
            <i class="fas fa-user-tie"></i>
            <span>Agent Signature</span>
            <i class="fas fa-check-circle" *ngIf="contractInfo.agentSigned"></i>
            <i class="fas fa-clock" *ngIf="!contractInfo.agentSigned"></i>
          </div>
          
          <div class="signature-item" [class.completed]="contractInfo.clientSigned">
            <i class="fas fa-user"></i>
            <span>Client Signature</span>
            <i class="fas fa-check-circle" *ngIf="contractInfo.clientSigned"></i>
            <i class="fas fa-clock" *ngIf="!contractInfo.clientSigned"></i>
          </div>
        </div>

        <!-- Client Signature Section -->
        <div class="client-signature-section" *ngIf="contractInfo.isClient && !contractInfo.clientSigned">
          <h3>Your Signature Required</h3>
          <p>Please provide your signature to confirm acceptance of this rental agreement.</p>
          
          <app-signature-pad
            [required]="true"
            (signatureSaved)="onClientSignatureSubmitted($event)"
            [actionButtonText]="isSubmitting ? 'Submitting...' : 'Submit Signature'">
          </app-signature-pad>
        </div>

        <!-- Payment Readiness -->
        <div class="payment-section">
          <div class="payment-status" *ngIf="!contractInfo.canProceedToPayment">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Waiting for all signatures to be completed before payment can proceed.</p>
          </div>
          
          <div class="payment-ready" *ngIf="contractInfo.canProceedToPayment">
            <i class="fas fa-check-circle"></i>
            <p>Contract fully signed! You can now proceed to payment.</p>
            <button 
              class="btn btn-primary btn-lg"
              [disabled]="isSubmitting"
              (click)="proceedToPayment()">
              <i class="fas fa-credit-card"></i>
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading contract information...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-secondary" (click)="loadContractInfo()">
          <i class="fas fa-refresh"></i>
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .contract-signing-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .contract-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .contract-header h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .contract-content {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .contract-details {
      padding: 30px;
      border-bottom: 1px solid #eee;
    }

    .contract-details h3 {
      color: #2c3e50;
      margin-bottom: 20px;
    }

    .contract-text p {
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .signature-status {
      padding: 20px 30px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }

    .signature-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 5px;
      background: white;
    }

    .signature-item.completed {
      background: #d4edda;
      color: #155724;
    }

    .signature-item i:first-child {
      margin-right: 10px;
      width: 20px;
    }

    .signature-item span {
      flex: 1;
      font-weight: 500;
    }

    .signature-item i:last-child {
      color: #28a745;
    }

    .client-signature-section {
      padding: 30px;
      border-bottom: 1px solid #eee;
    }

    .client-signature-section h3 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .payment-section {
      padding: 30px;
    }

    .payment-status {
      text-align: center;
      color: #856404;
      background: #fff3cd;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #ffeaa7;
    }

    .payment-ready {
      text-align: center;
      color: #155724;
      background: #d4edda;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #c3e6cb;
    }

    .payment-ready button {
      margin-top: 15px;
      padding: 12px 30px;
      font-size: 16px;
    }

    .loading-container,
    .error-container {
      text-align: center;
      padding: 40px;
    }

    .loading-container i {
      font-size: 2em;
      color: #007bff;
      margin-bottom: 15px;
    }

    .error-container i {
      font-size: 2em;
      color: #dc3545;
      margin-bottom: 15px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-lg {
      padding: 15px 30px;
      font-size: 18px;
    }
  `]
})
export class ContractSigningComponent implements OnInit {
  @Input() contractId!: string;
  @Input() bookingData?: any;

  contractInfo: ContractSigningInfo | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  constructor(
    private signatureService: SignatureService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.contractId) {
      this.loadContractInfo();
    }
  }

  async loadContractInfo() {
    this.isLoading = true;
    this.error = null;

    try {
      this.contractInfo = await this.signatureService.getContractSigningInfo(this.contractId).toPromise() || null;
    } catch (error) {
      console.error('Error loading contract info:', error);
      this.error = 'Failed to load contract information. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async onClientSignatureSubmitted(signatureData: any) {
    if (!this.contractId) {
      this.error = 'No contract ID provided';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      // Convert the signature data to the expected format
      const signaturePayload: SignatureData = {
        signatureImage: signatureData.signatureImage,
        signatureFont: signatureData.signatureFont,
        signatureText: signatureData.signatureText,
        signatureType: signatureData.signatureType
      };

      await this.signatureService.signContractAsClient(this.contractId, signaturePayload).toPromise();
      
      // Reload contract info to get updated status
      await this.loadContractInfo();
      
      // Show success message
      console.log('Contract signed successfully as client');
    } catch (error) {
      console.error('Error signing contract:', error);
      this.error = 'Failed to submit signature. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  proceedToPayment() {
    if (!this.contractInfo?.canProceedToPayment) {
      return;
    }

    // Emit event or navigate to payment
    // This would typically involve routing to the payment component
    // with the booking data and contract information
    console.log('Proceeding to payment with signed contract');
    
    // Example: You might want to emit an event or use router navigation
    // this.router.navigate(['/payment'], { state: { booking: this.bookingData, contractId: this.contractId } });
  }
}
