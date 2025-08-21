import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContractSigningComponent, ContractSigningData } from '../../../shared/components/contract-signing/contract-signing.component';
import { SignatureService } from '../../../core/services/signature.service';
import { StripeService } from '../../../core/services/stripe.service';
import { KonnectService } from '../../../core/services/konnect.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-contract-checkout',
  standalone: true,
  imports: [CommonModule, ContractSigningComponent],
  template: `
    <div class="contract-checkout-container">
      <!-- Checkout Header -->
      <div class="checkout-header">
        <h2><i class="fas fa-file-signature"></i> Contract & Payment</h2>
        <p class="lead">Please review and sign the contract before proceeding to payment</p>
      </div>

      <!-- Checkout Steps -->
      <div class="checkout-steps">
        <div class="step" [class.active]="currentStep === 'contract'" [class.completed]="currentStep !== 'contract' && contractSigned">
          <div class="step-number">1</div>
          <div class="step-label">Sign Contract</div>
        </div>
        <div class="step-connector" [class.completed]="contractSigned"></div>
        <div class="step" [class.active]="currentStep === 'payment'" [class.completed]="paymentCompleted">
          <div class="step-number">2</div>
          <div class="step-label">Payment</div>
        </div>
      </div>

      <!-- Error Messages -->
      <div class="alert alert-danger" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <!-- Loading State -->
      <div class="text-center" *ngIf="loading">
        <div class="spinner-border spinner-border-lg" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <p class="mt-2">{{ loadingMessage }}</p>
      </div>

      <!-- Contract Signing Section -->
      <div class="checkout-section" *ngIf="!loading && currentStep === 'contract'">
        <app-contract-signing
          [contractData]="contractData"
          (signatureCompleted)="onSignatureCompleted($event)"
          (paymentRequested)="onPaymentRequested($event)">
        </app-contract-signing>
        
        <!-- Temporary: Simulate Agent Signature for Testing -->
        <div class="alert alert-info mt-3" *ngIf="contractData && !contractData.agentSigned && contractData.clientSigned">
          <h5><i class="fas fa-info-circle"></i> For Testing Purposes</h5>
          <p>In a real application, the agent would sign through their dashboard. For testing, you can simulate the agent signature:</p>
          <button class="btn btn-warning" (click)="simulateAgentSignature()">
            <i class="fas fa-pen"></i> Simulate Agent Signature
          </button>
        </div>
      </div>

      <!-- Payment Section -->
      <div class="checkout-section" *ngIf="!loading && currentStep === 'payment'">
        <div class="payment-header">
          <h4><i class="fas fa-credit-card"></i> Payment Processing</h4>
          <p class="text-muted">Both parties have signed the contract. Complete your payment to finalize the agreement.</p>
        </div>

        <!-- Payment Summary -->
        <div class="payment-summary">
          <h5>Payment Summary</h5>
          <div class="summary-item">
            <span>Property:</span>
            <span>{{ contractData?.contract?.propertyId?.title }}</span>
          </div>
          <div class="summary-item">
            <span>Contract Amount:</span>
            <span class="amount">{{ contractData?.contract?.currency }} {{ contractData?.contract?.amount | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item" *ngIf="platformFee > 0">
            <span>Platform Fee:</span>
            <span class="fee">{{ contractData?.contract?.currency }} {{ platformFee | number:'1.2-2' }}</span>
          </div>
          <div class="summary-item total">
            <span><strong>Total Amount:</strong></span>
            <span class="total-amount"><strong>{{ contractData?.contract?.currency }} {{ totalAmount | number:'1.2-2' }}</strong></span>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="payment-methods">
          <h5>Choose Payment Method</h5>
          <div class="payment-options">
            <div class="payment-option" [class.selected]="selectedPaymentMethod === 'stripe'" (click)="selectPaymentMethod('stripe')">
              <div class="option-header">
                <i class="fab fa-stripe"></i>
                <span>Credit Card (Stripe)</span>
              </div>
              <p class="option-description">Pay securely with your credit or debit card</p>
            </div>
            <div class="payment-option" [class.selected]="selectedPaymentMethod === 'konnect'" (click)="selectPaymentMethod('konnect')">
              <div class="option-header">
                <i class="fas fa-mobile-alt"></i>
                <span>Konnect Payment</span>
              </div>
              <p class="option-description">Pay using Konnect mobile payment platform</p>
            </div>
          </div>
        </div>

        <!-- Payment Actions -->
        <div class="payment-actions">
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            (click)="goBackToContract()">
            <i class="fas fa-arrow-left"></i> Back to Contract
          </button>
          <button 
            type="button" 
            class="btn btn-success btn-lg"
            [disabled]="!selectedPaymentMethod || processingPayment"
            (click)="processPayment()">
            <i class="fas fa-credit-card" *ngIf="!processingPayment"></i>
            <i class="fas fa-spinner fa-spin" *ngIf="processingPayment"></i>
            {{ processingPayment ? 'Processing...' : 'Pay Now' }}
          </button>
        </div>
      </div>

      <!-- Contract Not Ready -->
      <div class="checkout-section" *ngIf="!loading && !contractData">
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Contract Required</strong>
          A signed contract is required before payment can be processed.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contract-checkout-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    .checkout-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .checkout-header h2 {
      margin-bottom: 15px;
      color: #333;
    }

    .checkout-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 20px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e9ecef;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .step.active .step-number {
      background: #007bff;
      color: white;
    }

    .step.completed .step-number {
      background: #28a745;
      color: white;
    }

    .step-label {
      font-size: 14px;
      font-weight: 500;
      color: #666;
    }

    .step.active .step-label {
      color: #007bff;
      font-weight: 600;
    }

    .step.completed .step-label {
      color: #28a745;
      font-weight: 600;
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: #e9ecef;
      margin: 0 15px;
      transition: all 0.3s ease;
    }

    .step-connector.completed {
      background: #28a745;
    }

    .checkout-section {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
    }

    .payment-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .payment-header h4 {
      margin-bottom: 10px;
      color: #333;
    }

    .payment-summary {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .payment-summary h5 {
      margin-bottom: 15px;
      color: #333;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 8px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item.total {
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #dee2e6;
      font-size: 16px;
    }

    .amount, .fee {
      font-weight: 500;
      color: #333;
    }

    .total-amount {
      font-size: 18px;
      color: #28a745;
    }

    .payment-methods {
      margin-bottom: 30px;
    }

    .payment-methods h5 {
      margin-bottom: 20px;
      color: #333;
    }

    .payment-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .payment-option {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .payment-option:hover {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .payment-option.selected {
      border-color: #007bff;
      background: #f8f9ff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }

    .option-header i {
      font-size: 20px;
    }

    .option-description {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .payment-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .btn-lg {
      padding: 12px 30px;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .checkout-steps {
        flex-direction: column;
        gap: 15px;
      }

      .step-connector {
        width: 2px;
        height: 30px;
        margin: 0;
      }

      .payment-options {
        grid-template-columns: 1fr;
      }

      .payment-actions {
        flex-direction: column;
        gap: 15px;
      }

      .payment-actions .btn {
        width: 100%;
      }
    }
  `]
})
export class ContractCheckoutComponent implements OnInit {
  @Input() contractId?: string;
  @Input() propertyId?: string;

  contractData?: ContractSigningData;
  currentStep: 'contract' | 'payment' = 'contract';
  contractSigned = false;
  paymentCompleted = false;
  
  loading = false;
  loadingMessage = '';
  errorMessage = '';
  successMessage = '';
  
  selectedPaymentMethod: 'stripe' | 'konnect' | null = null;
  processingPayment = false;
  
  platformFee = 0;
  totalAmount = 0;

  // New properties for reservation flow
  reservationData: any = null;
  property: any = null;
  reservation: any = null;

  constructor(
    private signatureService: SignatureService,
    private stripeService: StripeService,
    private konnectService: KonnectService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if we have reservation data from router state
    const navigation = this.router.getCurrentNavigation();
    let stateData = navigation?.extras.state;
    
    // If getCurrentNavigation() returns null, try to get data from history state
    if (!stateData && window.history.state) {
      stateData = window.history.state;
    }
    
    console.log('Navigation state data:', stateData); // Debug log
    
    if (stateData && stateData['property'] && stateData['reservation']) {
      // We're coming from the reservation flow
      this.handleReservationFlow(stateData);
    } else if (this.contractId) {
      // We're coming with an existing contract ID
      this.loadContractForSigning();
    } else {
      // Try to check session storage for pending reservation
      const pendingReservation = sessionStorage.getItem('pendingReservation');
      if (pendingReservation) {
        try {
          const reservationData = JSON.parse(pendingReservation);
          console.log('Found pending reservation in session storage:', reservationData);
          
          // Create state data from session storage
          const reconstructedState = {
            property: reservationData.property,
            reservation: reservationData.reservation,
            totalAmount: reservationData.totalAmount,
            metadata: reservationData.metadata,
            propertyCurrency: reservationData.propertyCurrency,
            exchangeRates: reservationData.exchangeRates
          };
          
          this.handleReservationFlow(reconstructedState);
          return;
        } catch (error) {
          console.error('Error parsing pending reservation:', error);
        }
      }
      
      this.errorMessage = 'Contract ID or reservation data is required for checkout';
    }
  }

  handleReservationFlow(stateData: any) {
    this.loading = true;
    this.loadingMessage = 'Creating contract from reservation...';
    
    console.log('Received state data:', stateData); // Debug log
    
    this.property = stateData['property'];
    this.reservation = stateData['reservation'];
    this.totalAmount = stateData['totalAmount'] || 0;
    this.reservationData = stateData;
    
    // Ensure property data is accessible
    const propertyTitle = this.property?.title || this.property?.name || 'Property';
    const propertyId = this.property?._id || this.property?.id;
    const agentId = this.property?.agentId || this.property?.agent?._id;
    
    console.log('Property data:', this.property); // Debug log
    console.log('Reservation data:', this.reservation); // Debug log
    console.log('Agent ID from property:', this.property?.agentId || this.property?.agent?._id); // Debug log
    console.log('Client ID from reservation:', this.reservation.userId || this.reservation.tenantId); // Debug log
    console.log('Check-in date:', this.reservation.checkInDate); // Debug log
    console.log('Check-out date:', this.reservation.checkOutDate); // Debug log
    
    // Get current user info for better debugging
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user from auth service:', currentUser);
    
    // Check if property has agent info, if not try to extract from different fields
    const agentInfo = this.property?.agent || this.property?.agentId || this.property?.owner;
    console.log('Agent info from property:', agentInfo);
    
    // Create contract data structure for the signing component
    this.contractData = {
      contract: {
        _id: 'temp-' + Date.now(), // Temporary ID until actual contract is created
        propertyId: propertyId,
        clientId: this.reservation.userId || this.reservation.tenantId,
        agentId: agentId,
        type: 'rental',
        title: `Rental Agreement - ${propertyTitle}`,
        description: `Rental agreement for ${propertyTitle} from ${this.reservation.checkInDate} to ${this.reservation.checkOutDate} for ${this.reservation.guestCount} guests.`,
        terms: `This is a rental agreement for the specified property. Check-in: ${this.reservation.checkInDate}, Check-out: ${this.reservation.checkOutDate}, Guests: ${this.reservation.guestCount}. Total amount: ${stateData['propertyCurrency'] || 'USD'} ${this.totalAmount}.`,
        amount: this.totalAmount,
        currency: stateData['propertyCurrency'] || 'USD',
        startDate: this.reservation.checkInDate,
        endDate: this.reservation.checkOutDate,
        checkInDate: this.reservation.checkInDate,
        checkOutDate: this.reservation.checkOutDate,
        guestCount: this.reservation.guestCount,
        status: 'pending_signatures',
        createdAt: new Date().toISOString()
      },
      isAgent: false, // User is the client in this flow
      isClient: true,
      requiresSignature: true,
      agentSigned: false, // Will be updated when agent signature is retrieved
      clientSigned: false, // Will be updated when client signs
      canProceedToPayment: false
    };
    
    this.calculatePaymentAmounts();
    this.loading = false;
  }

  loadContractForSigning() {
    this.loading = true;
    this.loadingMessage = 'Loading contract details...';
    this.errorMessage = '';

    this.signatureService.getContractForSigning(this.contractId!).subscribe({
      next: (contractData) => {
        this.contractData = contractData;
        this.checkContractStatus();
        this.calculatePaymentAmounts();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to load contract';
        this.loading = false;
      }
    });
  }

  checkContractStatus() {
    if (this.contractData) {
      // Check if both agent and client have signed
      const bothSigned = this.contractData.agentSigned && this.contractData.clientSigned;
      
      if (bothSigned) {
        this.contractData.canProceedToPayment = true;
        this.contractSigned = true;
        this.currentStep = 'payment';
        
        // Show success message
        console.log('Both signatures completed! Proceeding to payment...');
        this.showSuccessMessage('Contract fully signed! You can now proceed with payment.');
      } else {
        this.contractSigned = this.contractData.canProceedToPayment || false;
        if (this.contractSigned) {
          this.currentStep = 'payment';
        }
      }
    }
  }

  showSuccessMessage(message: string) {
    // You can implement a toast/notification service here
    console.log('SUCCESS:', message);
    // For now, just update a property that can be displayed in the template
    this.successMessage = message;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  // Temporary method for testing - simulates agent signature
  simulateAgentSignature() {
    if (this.contractData && this.contractId) {
      console.log('Simulating agent signature...');
      this.loading = true;
      this.loadingMessage = 'Processing agent signature...';
      
      // Simulate API call delay
      setTimeout(() => {
        // Update contract data to show agent has signed
        if (this.contractData) {
          this.contractData.agentSigned = true;
          this.contractData.canProceedToPayment = true;
        }
        
        this.loading = false;
        this.checkContractStatus();
        
        this.showSuccessMessage('Agent signature simulated successfully! Both parties have now signed the contract.');
      }, 1500);
    }
  }

  calculatePaymentAmounts() {
    if (this.contractData?.contract) {
      const contractAmount = this.contractData.contract.amount || 0;
      this.platformFee = contractAmount * 0.03; // 3% platform fee
      this.totalAmount = contractAmount + this.platformFee;
    }
  }

  onSignatureCompleted(event: any) {
    this.loading = true;
    this.loadingMessage = 'Processing signature...';

    // Check if this is a reservation flow (new contract) or existing contract flow
    const isReservationFlow = this.reservationData && this.property && this.reservation;
    
    if (isReservationFlow && event.type === 'client') {
      // For reservation flow, create the contract first with the client signature
      this.createContractFromReservation(event.signatureData);
    } else if (event.type === 'agent') {
      this.signatureService.signContractAsAgent(event.contractId).subscribe({
        next: (response) => {
          this.handleSignatureSuccess(response);
        },
        error: (error) => {
          this.handleSignatureError(error);
        }
      });
    } else if (event.type === 'client') {
      this.signatureService.signContractAsClient(event.contractId, event.signatureData).subscribe({
        next: (response) => {
          this.handleSignatureSuccess(response);
        },
        error: (error) => {
          this.handleSignatureError(error);
        }
      });
    }
  }

  createContractFromReservation(clientSignatureData: any) {
    // Debug: Check what data we actually have
    console.log('Property object:', this.property);
    console.log('Reservation object:', this.reservation);
    console.log('Reservation data:', this.reservationData);
    
    // Get current user from auth service
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user from auth service:', currentUser);
    
    // Extract IDs with fallbacks
    const propertyId = this.property?._id || this.property?.id;
    const clientId = currentUser?._id || this.reservation?.userId || this.reservation?.tenantId || this.reservationData?.userId || this.reservationData?.createdBy;
    let agentId = this.property?.agentId || this.property?.agent?._id;
    
    console.log('Extracted propertyId:', propertyId);
    console.log('Extracted clientId:', clientId);
    console.log('Extracted agentId:', agentId);
    console.log('Check-in date from reservation:', this.reservation?.checkInDate);
    console.log('Check-out date from reservation:', this.reservation?.checkOutDate);
    console.log('Check-in date from metadata:', this.reservationData?.metadata?.startDate);
    console.log('Check-out date from metadata:', this.reservationData?.metadata?.endDate);
    console.log('Guest count from metadata:', this.reservationData?.metadata?.guestCount);
    
    if (!propertyId) {
      this.handleSignatureError({ error: { error: 'Property ID is missing' } });
      return;
    }
    
    if (!clientId) {
      this.handleSignatureError({ error: { error: 'Client ID is missing. Please ensure you are logged in.' } });
      return;
    }
    
    if (!agentId) {
      // Temporary workaround: If no agent ID found, try to use a default or current user
      console.warn('Agent ID missing from property data. Using fallback approach.');
      
      // Try to extract from property owner field or use current user as fallback
      const fallbackAgentId = this.property?.owner?._id || currentUser?._id;
      
      if (!fallbackAgentId) {
        this.handleSignatureError({ error: { error: 'Agent ID is missing from property data. Property owner information not available.' } });
        return;
      }
      
      console.log('Using fallback agent ID:', fallbackAgentId);
      // Update agentId for the request
      agentId = fallbackAgentId;
    }

    const contractRequest = {
      propertyId: propertyId,
      clientId: clientId,
      agentId: agentId,
      amount: this.totalAmount,
      currency: this.reservationData['propertyCurrency'] || 'USD',
      checkInDate: this.reservation?.checkInDate || this.reservationData?.metadata?.startDate || this.reservationData?.startDate,
      checkOutDate: this.reservation?.checkOutDate || this.reservationData?.metadata?.endDate || this.reservationData?.endDate,
      guestCount: this.reservation?.guestCount || this.reservationData?.metadata?.guestCount || this.reservationData?.guestCount || 1,
      tenantSignature: clientSignatureData,
      metadata: this.reservationData['metadata']
    };

    console.log('Creating contract with data:', contractRequest); // Debug log

    this.signatureService.createContractFromReservation(contractRequest).subscribe({
      next: (response) => {
        console.log('Contract creation response:', response); // Debug log
        
        // Extract the contract ID from the response
        this.contractId = response.contract?._id || response.contract?.id;
        console.log('Contract ID extracted:', this.contractId);
        
        // Update contract data with the created contract
        this.contractData = response;
        this.handleSignatureSuccess(response);
      },
      error: (error) => {
        console.error('Contract creation error:', error); // Debug log
        this.handleSignatureError(error);
      }
    });
  }

  handleSignatureSuccess(response: any) {
    this.loading = false;
    
    // Clear pending reservation from session storage since contract is created
    sessionStorage.removeItem('pendingReservation');
    
    // Don't reload contract data since we already have it from the creation response
    // The contract data is already updated in the success handler
    console.log('Contract creation and signing completed successfully');
    
    // Check if we can proceed to payment (both signatures required)
    this.checkContractStatus();
  }

  handleSignatureError(error: any) {
    this.loading = false;
    this.errorMessage = error.error?.error || 'Failed to sign contract';
  }

  onPaymentRequested(event: any) {
    this.currentStep = 'payment';
    this.contractSigned = true;
  }

  selectPaymentMethod(method: 'stripe' | 'konnect') {
    this.selectedPaymentMethod = method;
    this.errorMessage = '';
  }

  goBackToContract() {
    this.currentStep = 'contract';
  }

  processPayment() {
    if (!this.selectedPaymentMethod || !this.contractData?.contract) {
      this.errorMessage = 'Please select a payment method';
      return;
    }

    this.processingPayment = true;
    this.errorMessage = '';

    // Determine if this is a reservation flow or existing contract flow
    const isReservationFlow = this.reservationData && this.property && this.reservation;
    
    let paymentData;
    
    if (isReservationFlow) {
      // Use reservation data for payment
      paymentData = {
        amount: this.totalAmount,
        currency: this.reservationData['propertyCurrency'] || 'USD',
        propertyId: this.property._id,
        reservation: this.reservation,
        metadata: {
          ...this.reservationData['metadata'],
          reservationFlow: true,
          propertyTitle: this.property.title,
          platformFee: this.platformFee
        }
      };
    } else {
      // Use existing contract data for payment
      paymentData = {
        amount: this.totalAmount,
        currency: this.contractData.contract.currency || 'USD',
        propertyId: this.contractData.contract.propertyId._id,
        contractId: this.contractData.contract._id,
        metadata: {
          contractId: this.contractData.contract._id,
          propertyTitle: this.contractData.contract.propertyId.title,
          platformFee: this.platformFee
        }
      };
    }

    if (this.selectedPaymentMethod === 'stripe') {
      this.processStripePayment(paymentData);
    } else if (this.selectedPaymentMethod === 'konnect') {
      this.processKonnectPayment(paymentData);
    }
  }

  processStripePayment(paymentData: any) {
    this.stripeService.createPaymentIntent(paymentData).subscribe({
      next: (response) => {
        // Redirect to Stripe checkout or handle payment intent
        this.router.navigate(['/payment/stripe'], {
          queryParams: {
            clientSecret: response.clientSecret,
            contractId: this.contractData?.contract._id
          }
        });
      },
      error: (error) => {
        this.processingPayment = false;
        this.errorMessage = error.error?.error || 'Failed to initialize payment';
      }
    });
  }

  processKonnectPayment(paymentData: any) {
    this.konnectService.createPayment(paymentData).subscribe({
      next: (response) => {
        // Redirect to Konnect payment page
        window.location.href = response.paymentUrl;
      },
      error: (error) => {
        this.processingPayment = false;
        this.errorMessage = error.error?.error || 'Failed to initialize payment';
      }
    });
  }
}
