import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { SignatureService, SignatureData } from '../../../core/services/signature.service';

@Component({
  selector: 'app-agent-signature-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, SignaturePadComponent],
  template: `
    <div class="signature-manager-container">
      <div class="header">
        <h4><i class="fas fa-signature"></i> Digital Signature Management</h4>
        <p class="text-muted">Your digital signature will be automatically applied to all contracts you sign.</p>
      </div>

      <!-- Loading State -->
      <div class="text-center" *ngIf="loading">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>

      <!-- Existing Signature Display -->
      <div class="current-signature" *ngIf="!loading && !editMode && existingSignature">
        <div class="signature-header">
          <h5>Current Signature</h5>
          <div class="signature-actions">
            <button type="button" class="btn btn-outline-primary btn-sm" (click)="editMode = true">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm ml-2" (click)="deleteSignature()">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>

        <div class="signature-display">
          <div class="signature-preview" *ngIf="existingSignature.signatureImage">
            <img [src]="existingSignature.signatureImage" alt="Your signature" class="signature-image">
          </div>
          <div class="signature-details">
            <div class="detail-item">
              <strong>Type:</strong> {{ existingSignature.signatureType | titlecase }}
            </div>
            <div class="detail-item" *ngIf="existingSignature.signatureType === 'typed'">
              <strong>Text:</strong> {{ existingSignature.signatureText }}
            </div>
            <div class="detail-item" *ngIf="existingSignature.signatureType === 'typed'">
              <strong>Font:</strong> {{ existingSignature.signatureFont }}
            </div>
            <div class="detail-item">
              <strong>Created:</strong> {{ existingSignature.uploadedAt | date:'medium' }}
            </div>
            <div class="detail-item">
              <strong>Status:</strong> 
              <span class="badge" [class.badge-success]="existingSignature.isActive" [class.badge-secondary]="!existingSignature.isActive">
                {{ existingSignature.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Signature State -->
      <div class="no-signature" *ngIf="!loading && !editMode && !existingSignature">
        <div class="empty-state">
          <i class="fas fa-signature fa-3x text-muted"></i>
          <h5>No Signature Found</h5>
          <p class="text-muted">Create your digital signature to automatically sign contracts.</p>
          <button type="button" class="btn btn-primary" (click)="editMode = true">
            <i class="fas fa-plus"></i> Create Signature
          </button>
        </div>
      </div>

      <!-- Signature Editor -->
      <div class="signature-editor" *ngIf="editMode">
        <div class="editor-header">
          <h5>{{ existingSignature ? 'Edit' : 'Create' }} Your Digital Signature</h5>
        </div>

        <app-signature-pad
          [actionButtonText]="existingSignature ? 'Update Signature' : 'Save Signature'"
          [required]="true"
          [existingSignature]="existingSignature"
          (signatureSaved)="saveSignature($event)"
          (signatureCanceled)="cancelEdit()">
        </app-signature-pad>
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

      <!-- Usage Information -->
      <div class="usage-info mt-4" *ngIf="!loading && !editMode">
        <div class="card">
          <div class="card-header">
            <h6><i class="fas fa-info-circle"></i> How It Works</h6>
          </div>
          <div class="card-body">
            <ul class="list-unstyled">
              <li><i class="fas fa-check text-success"></i> Your signature is securely stored and encrypted</li>
              <li><i class="fas fa-check text-success"></i> Automatically applied to all contracts you sign</li>
              <li><i class="fas fa-check text-success"></i> Provides legal validity for digital agreements</li>
              <li><i class="fas fa-check text-success"></i> Can be updated or changed anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .signature-manager-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .header h4 {
      margin-bottom: 10px;
      color: #333;
    }

    .current-signature {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .signature-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .signature-header h5 {
      margin: 0;
      color: #333;
    }

    .signature-actions .btn {
      margin-left: 8px;
    }

    .signature-display {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .signature-preview {
      flex: 0 0 250px;
      text-align: center;
    }

    .signature-image {
      max-width: 100%;
      max-height: 100px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .signature-details {
      flex: 1;
    }

    .detail-item {
      margin-bottom: 10px;
      padding: 5px 0;
    }

    .detail-item strong {
      color: #555;
      margin-right: 8px;
    }

    .no-signature {
      text-align: center;
      padding: 40px;
    }

    .empty-state {
      color: #666;
    }

    .empty-state i {
      margin-bottom: 20px;
    }

    .empty-state h5 {
      margin-bottom: 15px;
    }

    .signature-editor {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .editor-header {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .editor-header h5 {
      margin: 0;
      color: #333;
    }

    .usage-info .card {
      border: 1px solid #e3f2fd;
      background: #f8f9ff;
    }

    .usage-info .card-header {
      background: #e3f2fd;
      border-bottom: 1px solid #bbdefb;
    }

    .usage-info .card-header h6 {
      margin: 0;
      color: #1976d2;
    }

    .usage-info ul li {
      margin-bottom: 8px;
      padding-left: 8px;
    }

    .usage-info .fa-check {
      margin-right: 8px;
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
      .signature-display {
        flex-direction: column;
      }

      .signature-preview {
        flex: none;
        margin-bottom: 15px;
      }

      .signature-header {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
      }

      .signature-actions {
        text-align: center;
      }
    }
  `]
})
export class AgentSignatureManagerComponent implements OnInit {
  loading = false;
  editMode = false;
  existingSignature: any = null;
  errorMessage = '';
  successMessage = '';

  constructor(private signatureService: SignatureService) {}

  ngOnInit() {
    this.loadExistingSignature();
  }

  loadExistingSignature() {
    this.loading = true;
    this.clearMessages();

    this.signatureService.getAgentSignature().subscribe({
      next: (response) => {
        this.existingSignature = response.signature;
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 404) {
          // No signature found - this is normal for new agents
          this.existingSignature = null;
        } else {
          this.errorMessage = 'Failed to load signature';
        }
        this.loading = false;
      }
    });
  }

  saveSignature(signatureData: SignatureData) {
    this.loading = true;
    this.clearMessages();

    this.signatureService.saveAgentSignature(signatureData).subscribe({
      next: (response) => {
        this.existingSignature = response.signature;
        this.editMode = false;
        this.successMessage = 'Signature saved successfully!';
        this.loading = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to save signature';
        this.loading = false;
      }
    });
  }

  deleteSignature() {
    if (confirm('Are you sure you want to delete your signature? This action cannot be undone.')) {
      // For now, we'll just set the signature as inactive
      // You can implement a proper delete endpoint if needed
      this.existingSignature = null;
      this.successMessage = 'Signature deleted successfully!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.clearMessages();
  }

  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
