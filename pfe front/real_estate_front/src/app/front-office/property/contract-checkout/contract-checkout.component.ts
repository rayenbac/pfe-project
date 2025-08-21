import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ContractSigningComponent } from '../contract-signing/contract-signing.component';
import { SignatureService, ContractSigningInfo } from '../../../core/services/signature.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contract-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ContractSigningComponent],
  template: `
    <div class="contract-checkout-container">
      <!-- Progress Steps -->
      <div class="checkout-progress">
        <div class="progress-step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
          <div class="step-number">1</div>
          <span>Review Booking</span>
        </div>
        <div class="progress-line" [class.completed]="currentStep > 1"></div>
        <div class="progress-step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
          <div class="step-number">2</div>
          <span>Sign Contract</span>
        </div>
        <div class="progress-line" [class.completed]="currentStep > 2"></div>
        <div class="progress-step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
          <div class="step-number">3</div>
          <span>Payment</span>
        </div>
      </div>

      <!-- Step 1: Booking Review -->
      <div *ngIf="currentStep === 1" class="step-content">
        <div class="booking-review">
          <h2>Review Your Booking</h2>
          <div class="booking-details" *ngIf="bookingData">
            <div class="property-info">
              <h3>{{ bookingData.property?.title }}</h3>
              <p class="property-address">
                <i class="fas fa-map-marker-alt"></i>
                {{ bookingData.property?.address }}
              </p>
            </div>

            <div class="booking-info">
              <div class="info-row">
                <span class="label">Check-in:</span>
                <span class="value">{{ bookingData.checkInDate | date:'fullDate' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Check-out:</span>
                <span class="value">{{ bookingData.checkOutDate | date:'fullDate' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Guests:</span>
                <span class="value">{{ bookingData.numberOfGuests }}</span>
              </div>
              <div class="info-row">
                <span class="label">Duration:</span>
                <span class="value">{{ getDuration() }} night(s)</span>
              </div>
            </div>

            <div class="pricing-summary">
              <div class="price-row">
                <span>Nightly Rate:</span>
                <span>{{ bookingData.property?.price | currency }}</span>
              </div>
              <div class="price-row">
                <span>{{ getDuration() }} night(s):</span>
                <span>{{ (bookingData.property?.price * getDuration()) | currency }}</span>
              </div>
              <div class="price-row" *ngIf="serviceFee > 0">
                <span>Service Fee:</span>
                <span>{{ serviceFee | currency }}</span>
              </div>
              <div class="price-row total">
                <span>Total:</span>
                <span>{{ getTotalAmount() | currency }}</span>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="goBack()">
              <i class="fas fa-arrow-left"></i>
              Back to Property
            </button>
            <button class="btn btn-primary" (click)="proceedToContract()" [disabled]="isProcessing">
              <i class="fas fa-file-contract"></i>
              Proceed to Contract
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Contract Signing -->
      <div *ngIf="currentStep === 2" class="step-content">
        <div class="contract-step">
          <div class="step-header">
            <button class="btn btn-link" (click)="currentStep = 1">
              <i class="fas fa-arrow-left"></i>
              Back to Review
            </button>
          </div>

          <app-contract-signing
            [contractId]="contractId!"
            [bookingData]="bookingData"
            *ngIf="contractId">
          </app-contract-signing>

          <div class="contract-actions" *ngIf="contractInfo?.canProceedToPayment">
            <button class="btn btn-success btn-lg" (click)="proceedToPayment()" [disabled]="isProcessing">
              <i class="fas fa-credit-card"></i>
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Payment -->
      <div *ngIf="currentStep === 3" class="step-content">
        <div class="payment-step">
          <div class="step-header">
            <button class="btn btn-link" (click)="currentStep = 2">
              <i class="fas fa-arrow-left"></i>
              Back to Contract
            </button>
          </div>

          <div class="payment-summary">
            <h2>Complete Your Payment</h2>
            <div class="final-amount">
              <span>Total Amount:</span>
              <span class="amount">{{ getTotalAmount() | currency }}</span>
            </div>
            <p class="payment-note">
              <i class="fas fa-shield-alt"></i>
              Your contract has been signed and secured. Complete payment to confirm your booking.
            </p>
          </div>

          <div class="payment-methods">
            <h3>Select Payment Method</h3>
            <div class="payment-options">
              <label class="payment-option">
                <input type="radio" name="paymentMethod" value="stripe" [(ngModel)]="selectedPaymentMethod">
                <div class="payment-card">
                  <i class="fab fa-cc-stripe"></i>
                  <span>Credit/Debit Card</span>
                  <small>Secure payment via Stripe</small>
                </div>
              </label>
              
              <label class="payment-option">
                <input type="radio" name="paymentMethod" value="konnect" [(ngModel)]="selectedPaymentMethod">
                <div class="payment-card">
                  <i class="fas fa-university"></i>
                  <span>Bank Transfer</span>
                  <small>Secure payment via Konnect</small>
                </div>
              </label>
            </div>
          </div>

          <div class="payment-actions">
            <button 
              class="btn btn-success btn-lg"
              [disabled]="!selectedPaymentMethod || isProcessing"
              (click)="processPayment()">
              <i class="fas fa-lock"></i>
              <span *ngIf="!isProcessing">Complete Secure Payment</span>
              <span *ngIf="isProcessing">
                <i class="fas fa-spinner fa-spin"></i>
                Processing...
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="loading-content">
          <i class="fas fa-spinner fa-spin"></i>
          <p>{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-overlay">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Something went wrong</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="retryCurrentAction()">
            <i class="fas fa-refresh"></i>
            Try Again
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contract-checkout-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
    }

    .checkout-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      padding: 20px 0;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    .progress-step.active {
      opacity: 1;
      color: #007bff;
    }

    .progress-step.completed {
      opacity: 1;
      color: #28a745;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .progress-step.active .step-number {
      background: #007bff;
      color: white;
    }

    .progress-step.completed .step-number {
      background: #28a745;
      color: white;
    }

    .progress-line {
      width: 80px;
      height: 2px;
      background: #e9ecef;
      margin: 0 20px;
      transition: background 0.3s ease;
    }

    .progress-line.completed {
      background: #28a745;
    }

    .step-content {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .booking-review {
      padding: 30px;
    }

    .booking-review h2 {
      color: #2c3e50;
      margin-bottom: 25px;
    }

    .property-info h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .property-address {
      color: #6c757d;
      margin-bottom: 20px;
    }

    .booking-info {
      margin-bottom: 30px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f1f1f1;
    }

    .info-row .label {
      font-weight: 500;
      color: #6c757d;
    }

    .info-row .value {
      font-weight: 600;
      color: #2c3e50;
    }

    .pricing-summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .price-row.total {
      border-top: 2px solid #dee2e6;
      padding-top: 10px;
      margin-top: 10px;
      font-weight: bold;
      font-size: 1.1em;
      color: #2c3e50;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .contract-step,
    .payment-step {
      padding: 30px;
    }

    .step-header {
      margin-bottom: 20px;
    }

    .contract-actions {
      margin-top: 30px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .payment-summary {
      text-align: center;
      margin-bottom: 30px;
    }

    .payment-summary h2 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .final-amount {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      font-size: 1.5em;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 15px;
    }

    .payment-note {
      color: #6c757d;
      font-style: italic;
    }

    .payment-methods h3 {
      color: #2c3e50;
      margin-bottom: 20px;
    }

    .payment-options {
      display: grid;
      gap: 15px;
      margin-bottom: 30px;
    }

    .payment-option {
      cursor: pointer;
    }

    .payment-option input[type="radio"] {
      display: none;
    }

    .payment-card {
      padding: 20px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      background: white;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .payment-option input[type="radio"]:checked + .payment-card {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .payment-card i {
      font-size: 1.5em;
      color: #007bff;
    }

    .payment-card span {
      font-weight: 600;
      color: #2c3e50;
    }

    .payment-card small {
      color: #6c757d;
      margin-left: auto;
    }

    .payment-actions {
      text-align: center;
    }

    .loading-overlay,
    .error-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-content,
    .error-content {
      background: white;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }

    .loading-content i {
      font-size: 3em;
      color: #007bff;
      margin-bottom: 20px;
    }

    .error-content i {
      font-size: 3em;
      color: #dc3545;
      margin-bottom: 20px;
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

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #1e7e34;
    }

    .btn-link {
      background: transparent;
      color: #007bff;
      border: none;
      padding: 5px 10px;
    }

    .btn-link:hover {
      color: #0056b3;
      text-decoration: underline;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-lg {
      padding: 15px 30px;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .contract-checkout-container {
        padding: 10px;
      }

      .checkout-progress {
        flex-direction: column;
        gap: 20px;
      }

      .progress-line {
        transform: rotate(90deg);
        width: 40px;
      }

      .step-actions {
        flex-direction: column;
        gap: 15px;
      }

      .payment-options {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ContractCheckoutComponent implements OnInit, OnDestroy {
  currentStep = 1;
  bookingData: any = null;
  contractId: string | null = null;
  contractInfo: ContractSigningInfo | null = null;
  selectedPaymentMethod: 'stripe' | 'konnect' | null = null;
  serviceFee = 50; // Default service fee

  isLoading = false;
  isProcessing = false;
  loadingMessage = '';
  error: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private signatureService: SignatureService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    // Get booking data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.bookingData = navigation.extras.state;
    }
  }

  ngOnInit() {
    if (!this.bookingData) {
      // Try to get from session storage as fallback
      const storedData = sessionStorage.getItem('pendingBooking');
      if (storedData) {
        this.bookingData = JSON.parse(storedData);
      } else {
        this.router.navigate(['/properties']);
        return;
      }
    }

    // Store booking data in session storage for recovery
    sessionStorage.setItem('pendingBooking', JSON.stringify(this.bookingData));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getDuration(): number {
    if (!this.bookingData?.checkInDate || !this.bookingData?.checkOutDate) {
      return 1;
    }
    const checkIn = new Date(this.bookingData.checkInDate);
    const checkOut = new Date(this.bookingData.checkOutDate);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
  }

  getTotalAmount(): number {
    const baseAmount = (this.bookingData?.property?.price || 0) * this.getDuration();
    return baseAmount + this.serviceFee;
  }

  goBack() {
    this.router.navigate(['/properties', this.bookingData?.property?.id]);
  }

  async proceedToContract() {
    this.isProcessing = true;
    this.error = null;

    try {
      // Create contract for this booking
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || !currentUser._id) {
        throw new Error('User not authenticated');
      }

      const contractData = {
        propertyId: this.bookingData.property.id,
        agentId: this.bookingData.property.agentId,
        clientId: currentUser._id,
        bookingDetails: {
          checkInDate: this.bookingData.checkInDate,
          checkOutDate: this.bookingData.checkOutDate,
          numberOfGuests: this.bookingData.numberOfGuests,
          totalAmount: this.getTotalAmount(),
          propertyTitle: this.bookingData.property.title,
          agentName: this.bookingData.property.agent?.name,
          clientName: this.authService.getCurrentUser()?.name
        }
      };

      const contract = await this.signatureService.createContract(contractData).toPromise();
      this.contractId = contract.id;
      
      this.currentStep = 2;
    } catch (error) {
      console.error('Error creating contract:', error);
      this.error = 'Failed to create contract. Please try again.';
    } finally {
      this.isProcessing = false;
    }
  }

  async proceedToPayment() {
    try {
      // Verify contract is fully signed
      this.contractInfo = await this.signatureService.getContractSigningInfo(this.contractId!).toPromise() || null;
      
      if (!this.contractInfo?.canProceedToPayment) {
        this.error = 'Contract must be fully signed before proceeding to payment.';
        return;
      }

      this.currentStep = 3;
    } catch (error) {
      console.error('Error verifying contract signatures:', error);
      this.error = 'Failed to verify contract signatures. Please try again.';
    }
  }

  async processPayment() {
    if (!this.selectedPaymentMethod) {
      this.error = 'Please select a payment method.';
      return;
    }

    this.isProcessing = true;
    this.loadingMessage = 'Processing your payment...';
    this.error = null;

    try {
      const paymentData = {
        amount: this.getTotalAmount(),
        bookingData: this.bookingData,
        contractId: this.contractId,
        paymentMethod: this.selectedPaymentMethod
      };

      if (this.selectedPaymentMethod === 'stripe') {
        // Redirect to Stripe checkout
        const response = await this.http.post<{sessionUrl: string}>(`${environment.apiBaseUrl}/stripe/create-session`, paymentData).toPromise();
        window.location.href = response!.sessionUrl;
      } else if (this.selectedPaymentMethod === 'konnect') {
        // Redirect to Konnect payment
        const response = await this.http.post<{paymentUrl: string}>(`${environment.apiBaseUrl}/konnect/create-payment`, paymentData).toPromise();
        window.location.href = response!.paymentUrl;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      this.error = 'Failed to process payment. Please try again.';
      this.isProcessing = false;
    }
  }

  retryCurrentAction() {
    this.error = null;
    
    switch (this.currentStep) {
      case 1:
        // Reload booking data
        break;
      case 2:
        this.proceedToContract();
        break;
      case 3:
        this.proceedToPayment();
        break;
    }
  }
}
