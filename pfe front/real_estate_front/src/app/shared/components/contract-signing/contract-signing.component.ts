import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignaturePadComponent } from '../signature-pad/signature-pad.component';

export interface ContractSigningData {
  contract: any;
  isAgent: boolean;
  isClient: boolean;
  requiresSignature: boolean;
  agentSigned: boolean;
  clientSigned: boolean;
  canProceedToPayment: boolean;
}

@Component({
  selector: 'app-contract-signing',
  standalone: true,
  imports: [CommonModule, FormsModule, SignaturePadComponent],
  template: `
    <div class="contract-signing-container">
      <!-- Contract Header -->
      <div class="contract-header">
        <h3><i class="fas fa-file-contract"></i> Contract Agreement</h3>
        <div class="contract-id">Contract ID: {{ contractData?.contract?._id }}</div>
      </div>

      <!-- Contract Status -->
      <div class="signing-status">
        <div class="status-item">
          <i class="fas fa-user-tie" [class.text-success]="contractData?.agentSigned" [class.text-muted]="!contractData?.agentSigned"></i>
          <span>Agent</span>
          <span class="badge" [class.badge-success]="contractData?.agentSigned" [class.badge-secondary]="!contractData?.agentSigned">
            {{ contractData?.agentSigned ? 'Signed' : 'Pending' }}
          </span>
        </div>
        <div class="status-connector" [class.completed]="contractData?.agentSigned && contractData?.clientSigned"></div>
        <div class="status-item">
          <i class="fas fa-user" [class.text-success]="contractData?.clientSigned" [class.text-muted]="!contractData?.clientSigned"></i>
          <span>Client</span>
          <span class="badge" [class.badge-success]="contractData?.clientSigned" [class.badge-secondary]="!contractData?.clientSigned">
            {{ contractData?.clientSigned ? 'Signed' : 'Pending' }}
          </span>
        </div>
      </div>

      <!-- Contract Details -->
      <div class="contract-details" *ngIf="contractData?.contract">
        <div class="row">
          <div class="col-md-6">
            <h5>Property Information</h5>
            <div class="detail-item">
              <strong>Property:</strong> {{ contractData?.contract?.propertyId?.title || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Address:</strong> {{ contractData?.contract?.propertyId?.address || 'N/A' }}
            </div>
            <div class="detail-item">
              <strong>Type:</strong> {{ contractData?.contract?.type | titlecase }}
            </div>
          </div>
          <div class="col-md-6">
            <h5>Contract Terms</h5>
            <div class="detail-item">
              <strong>Amount:</strong> {{ contractData?.contract?.currency }} {{ contractData?.contract?.amount | number:'1.2-2' }}
            </div>
            <div class="detail-item">
              <strong>Commission:</strong> {{ contractData?.contract?.commissionRate }}% ({{ contractData?.contract?.currency }} {{ contractData?.contract?.commission | number:'1.2-2' }})
            </div>
            <div class="detail-item">
              <strong>Start Date:</strong> {{ contractData?.contract?.startDate | date:'mediumDate' }}
            </div>
            <div class="detail-item" *ngIf="contractData?.contract?.endDate">
              <strong>End Date:</strong> {{ contractData?.contract?.endDate | date:'mediumDate' }}
            </div>
          </div>
        </div>

        <!-- Contract Terms and Conditions -->
        <div class="contract-terms mt-4">
          <h5>Terms and Conditions</h5>
          <div class="terms-content">
            {{ contractData?.contract?.terms }}
          </div>
        </div>

        <!-- Contract Description -->
        <div class="contract-description mt-3">
          <h5>Description</h5>
          <p>{{ contractData?.contract?.description }}</p>
        </div>
      </div>

      <!-- Agent Signature Section (Auto-injected) -->
      <div class="signature-section" *ngIf="contractData?.isAgent && !contractData?.agentSigned">
        <div class="signature-header">
          <h5><i class="fas fa-signature"></i> Agent Signature</h5>
          <p class="text-muted">Your signature will be automatically applied from your profile.</p>
        </div>
        
        <div class="agent-signature-actions">
          <button 
            type="button" 
            class="btn btn-primary"
            [disabled]="signingInProgress"
            (click)="signAsAgent()">
            <i class="fas fa-pen-nib" *ngIf="!signingInProgress"></i>
            <i class="fas fa-spinner fa-spin" *ngIf="signingInProgress"></i>
            {{ signingInProgress ? 'Signing...' : 'Sign Contract' }}
          </button>
        </div>
      </div>

      <!-- Client Signature Section (Capture signature) -->
      <div class="signature-section" *ngIf="contractData?.isClient && !contractData?.clientSigned">
        <div class="signature-header">
          <h5><i class="fas fa-signature"></i> Client Signature</h5>
          <p class="text-muted">Please provide your electronic signature to proceed.</p>
        </div>

        <div class="client-signature-area" *ngIf="!showClientSignaturePad">
          <button 
            type="button" 
            class="btn btn-primary"
            (click)="showClientSignaturePad = true">
            <i class="fas fa-signature"></i> Add Your Signature
          </button>
        </div>

        <div class="signature-pad-wrapper" *ngIf="showClientSignaturePad">
          <app-signature-pad
            actionButtonText="Sign Contract"
            [required]="true"
            (signatureSaved)="signAsClient($event)"
            (signatureCanceled)="showClientSignaturePad = false">
          </app-signature-pad>
        </div>
      </div>

      <!-- Already Signed Display -->
      <div class="signature-section" *ngIf="contractData?.agentSigned && contractData?.isAgent">
        <div class="signature-header">
          <h5><i class="fas fa-check-circle text-success"></i> Agent Signature</h5>
          <p class="text-success">You have successfully signed this contract.</p>
        </div>
        <div class="signature-info">
          <small class="text-muted">
            Signed on: {{ contractData?.contract?.agentSignatureDate | date:'medium' }}
          </small>
        </div>
      </div>

      <div class="signature-section" *ngIf="contractData?.clientSigned && contractData?.isClient">
        <div class="signature-header">
          <h5><i class="fas fa-check-circle text-success"></i> Client Signature</h5>
          <p class="text-success">You have successfully signed this contract.</p>
        </div>
        <div class="signature-info">
          <small class="text-muted">
            Signed on: {{ contractData?.contract?.clientSignatureDate | date:'medium' }}
          </small>
        </div>
      </div>

      <!-- Payment Readiness -->
      <div class="payment-status mt-4" *ngIf="contractData?.canProceedToPayment">
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <strong>Contract Fully Signed!</strong>
          Both parties have signed the contract. You can now proceed to payment.
        </div>
        <div class="payment-actions">
          <button 
            type="button" 
            class="btn btn-success btn-lg"
            (click)="proceedToPayment()">
            <i class="fas fa-credit-card"></i> Proceed to Payment
          </button>
        </div>
      </div>

      <!-- Waiting for Other Party -->
      <div class="waiting-status mt-4" *ngIf="!contractData?.canProceedToPayment && (contractData?.agentSigned || contractData?.clientSigned)">
        <div class="alert alert-info">
          <i class="fas fa-clock"></i>
          <strong>Waiting for {{ getWaitingParty() }}</strong>
          {{ getWaitingMessage() }}
        </div>
      </div>

      <!-- Error Messages -->
      <div class="alert alert-danger mt-3" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <!-- Success Messages -->
      <div class="alert alert-success mt-3" *ngIf="successMessage">
        <i class="fas fa-check-circle"></i>
        {{ successMessage }}
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
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .contract-header h3 {
      margin-bottom: 10px;
      color: #333;
    }

    .contract-id {
      color: #666;
      font-size: 14px;
    }

    .signing-status {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 0 20px;
    }

    .status-item i {
      font-size: 24px;
    }

    .status-connector {
      flex: 1;
      height: 2px;
      background: #ddd;
      margin: 0 20px;
      position: relative;
    }

    .status-connector.completed {
      background: #28a745;
    }

    .status-connector.completed::after {
      content: '→';
      position: absolute;
      right: -10px;
      top: -8px;
      color: #28a745;
      font-weight: bold;
    }

    .contract-details {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 30px;
    }

    .contract-details h5 {
      color: #333;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }

    .detail-item {
      margin-bottom: 10px;
      padding: 5px 0;
    }

    .detail-item strong {
      color: #555;
      margin-right: 8px;
    }

    .terms-content {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 15px;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.5;
    }

    .signature-section {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 20px;
    }

    .signature-header {
      margin-bottom: 20px;
    }

    .signature-header h5 {
      margin-bottom: 8px;
      color: #333;
    }

    .agent-signature-actions,
    .client-signature-area {
      text-align: center;
      padding: 20px;
    }

    .signature-pad-wrapper {
      margin-top: 20px;
    }

    .signature-info {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }

    .payment-status,
    .waiting-status {
      text-align: center;
    }

    .payment-actions {
      margin-top: 15px;
    }

    .btn-lg {
      padding: 12px 30px;
      font-size: 16px;
    }

    .badge {
      font-size: 12px;
      padding: 4px 8px;
    }

    .badge-success {
      background-color: #28a745;
    }

    .badge-secondary {
      background-color: #6c757d;
    }

    @media (max-width: 768px) {
      .signing-status {
        flex-direction: column;
        gap: 15px;
      }

      .status-connector {
        width: 2px;
        height: 30px;
        margin: 0;
      }

      .status-connector.completed::after {
        content: '↓';
        right: -8px;
        top: 25px;
      }
    }
  `]
})
export class ContractSigningComponent implements OnInit {
  @Input() contractData?: ContractSigningData;
  @Output() signatureCompleted = new EventEmitter<any>();
  @Output() paymentRequested = new EventEmitter<any>();

  showClientSignaturePad = false;
  signingInProgress = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    // Component initialization
  }

  async signAsAgent() {
    this.signingInProgress = true;
    this.clearMessages();

    try {
      // Emit signature completion event - parent component will handle the API call
      this.signatureCompleted.emit({
        type: 'agent',
        contractId: this.contractData?.contract?._id
      });
      
      this.successMessage = 'Contract signed successfully!';
    } catch (error) {
      this.errorMessage = 'Failed to sign contract. Please try again.';
    } finally {
      this.signingInProgress = false;
    }
  }

  async signAsClient(signatureData: any) {
    this.signingInProgress = true;
    this.clearMessages();

    try {
      // Emit signature completion event with signature data
      this.signatureCompleted.emit({
        type: 'client',
        contractId: this.contractData?.contract?._id,
        signatureData: signatureData
      });
      
      this.showClientSignaturePad = false;
      this.successMessage = 'Contract signed successfully!';
    } catch (error) {
      this.errorMessage = 'Failed to sign contract. Please try again.';
    } finally {
      this.signingInProgress = false;
    }
  }

  proceedToPayment() {
    this.paymentRequested.emit({
      contractId: this.contractData?.contract?._id,
      contract: this.contractData?.contract
    });
  }

  getWaitingParty(): string {
    if (this.contractData?.agentSigned && !this.contractData?.clientSigned) {
      return 'Client Signature';
    } else if (!this.contractData?.agentSigned && this.contractData?.clientSigned) {
      return 'Agent Signature';
    }
    return 'Signatures';
  }

  getWaitingMessage(): string {
    if (this.contractData?.agentSigned && !this.contractData?.clientSigned) {
      return 'The client needs to sign the contract before payment can be processed.';
    } else if (!this.contractData?.agentSigned && this.contractData?.clientSigned) {
      return 'The agent needs to sign the contract before payment can be processed.';
    }
    return 'Both parties need to sign the contract before payment can be processed.';
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
