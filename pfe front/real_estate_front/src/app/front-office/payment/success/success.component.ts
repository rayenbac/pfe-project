import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { StripeService } from '../../../core/services/stripe.service';
import { AuthService } from '../../../core/services/auth.service';
import { AvailabilityService } from '../../../core/services/availability.service';
import { SignatureService } from '../../../core/services/signature.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { KonnectService } from '../../../core/services/konnect.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css']
})
export class SuccessComponent implements OnInit {
  paymentIntentId: string | null = null;
  konnectRef: string | null = null;
  sessionId: string | null = null;
  contractId: string | null = null; // Add contract ID for signature verification
  paymentStatus: 'succeeded' | 'processing' | 'failed' = 'processing';
  loading = true;
  error: string | null = null;
  paymentDetails: any = null;
  contractSigned = false; // Track contract signature status

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private stripeService: StripeService,
    private authService: AuthService,
    private konnectService: KonnectService,
    private availabilityService: AvailabilityService,
    private signatureService: SignatureService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.getCurrentUser()) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to view payment details',
        icon: 'warning',
        confirmButtonText: 'Log In'
      }).then(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      });
      return;
    }

    // Get session_id, payment_intent, or konnect ref from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || null;
      this.paymentIntentId = params['payment_intent'] || null;
      this.konnectRef = params['ref'] || null;
      this.contractId = params['contractId'] || null; // Get contract ID from params
      
      if (this.konnectRef) {
        this.confirmKonnectPayment(this.konnectRef);
      } else if (this.sessionId) {
        this.getStripePaymentBySessionId(this.sessionId);
      } else if (this.paymentIntentId) {
        this.confirmPayment(this.paymentIntentId);
      } else {
        this.loading = false;
        this.error = 'Payment information not found';
      }
    });
  }

  async confirmKonnectPayment(ref: string): Promise<void> {
    try {
      this.paymentDetails = await firstValueFrom(this.konnectService.getPaymentDetails(ref));
      this.paymentStatus = this.paymentDetails.konnectStatus === 'completed' ? 'succeeded' : 
                          this.paymentDetails.konnectStatus === 'pending' ? 'processing' : 'failed';
      
      // Try to get reservation data from session storage
      const storedReservation = sessionStorage.getItem('pendingReservation');
      if (storedReservation && this.paymentStatus === 'succeeded') {
        try {
          const navigationState = JSON.parse(storedReservation);
          console.log('Found stored reservation data for Konnect payment:', navigationState);
          
          // Create the booking with actual reservation data
          await this.createRealBooking(navigationState);
          
          // Clean up session storage
          sessionStorage.removeItem('pendingReservation');
        } catch (parseError) {
          console.error('Error parsing stored reservation data:', parseError);
          sessionStorage.removeItem('pendingReservation');
        }
      }

      // Verify contract signatures if contractId is present
      if (this.contractId && this.paymentStatus === 'succeeded') {
        await this.verifyContractSignatures();
      }
      
      this.loading = false;
    } catch (error) {
      console.error('Error confirming Konnect payment:', error);
      this.error = 'Failed to confirm Konnect payment. Please contact support.';
      this.paymentStatus = 'failed';
      this.loading = false;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<void> {
    try {
      this.paymentDetails = await firstValueFrom(this.stripeService.confirmPayment(paymentIntentId));
      this.paymentStatus = this.paymentDetails.status === 'completed' ? 'succeeded' : 
                          this.paymentDetails.status === 'pending' ? 'processing' : 'failed';
      this.loading = false;
    } catch (error) {
      console.error('Error confirming payment:', error);
      this.error = 'Failed to confirm payment. Please contact support.';
      this.paymentStatus = 'failed';
      this.loading = false;
    }
  }

  async getStripePaymentBySessionId(sessionId: string): Promise<void> {
    try {
      console.log('Attempting to fetch payment details for session:', sessionId);
      this.paymentDetails = await firstValueFrom(this.stripeService.getPaymentBySessionId(sessionId));
      this.paymentStatus = this.paymentDetails.status === 'completed' ? 'succeeded' : 
                          this.paymentDetails.status === 'pending' ? 'processing' : 'failed';
      
      console.log('Payment details received from Stripe:', this.paymentDetails);
      this.loading = false;
      
      // Try to create booking from Stripe payment data if available
      if (this.paymentStatus === 'succeeded' && this.paymentDetails) {
        await this.createBookingFromStripeData();
      }
      
    } catch (error) {
      console.error('Error fetching Stripe payment by session_id:', error);
      
      // Try to get reservation data from session storage first
      const storedReservation = sessionStorage.getItem('pendingReservation');
      let navigationState = null;
      
      if (storedReservation) {
        try {
          navigationState = JSON.parse(storedReservation);
          console.log('Found stored reservation data:', navigationState);
          
          // Check if data is not too old (within 1 hour)
          const now = Date.now();
          const dataAge = now - (navigationState.timestamp || 0);
          if (dataAge > 3600000) { // 1 hour in milliseconds
            console.log('Stored reservation data is too old, removing...');
            sessionStorage.removeItem('pendingReservation');
            navigationState = null;
          }
        } catch (parseError) {
          console.error('Error parsing stored reservation data:', parseError);
          sessionStorage.removeItem('pendingReservation');
        }
      }
      
      // If no stored data, try to get from navigation state
      if (!navigationState) {
        navigationState = history.state;
        console.log('Using navigation state:', navigationState);
      }
      
      if (navigationState?.property && navigationState?.reservation) {
        // Use actual reservation data from session storage
        this.paymentDetails = {
          stripePaymentIntentId: sessionId,
          amount: navigationState.totalAmount, // Use original amount, not converted
          currency: navigationState.propertyCurrency || 'USD', // Use original currency
          status: 'completed',
          createdAt: new Date(),
          propertyId: navigationState.property,
          propertyTitle: navigationState.property.title,
          reservationData: navigationState.reservation,
          metadata: navigationState.metadata
        };
        this.paymentStatus = 'succeeded';
        this.loading = false;
        
        console.log('Payment details constructed from session storage:', this.paymentDetails);
        
        // Create the actual booking
        await this.createRealBooking(navigationState);
        
        // Clean up session storage after successful processing
        sessionStorage.removeItem('pendingReservation');
      } else {
        // No data available
        this.error = 'Reservation data not found. Please contact support.';
        this.paymentStatus = 'failed';
        this.loading = false;
      }
    }
  }

  private async createBookingFromStripeData(): Promise<void> {
    try {
      // Get stored reservation data for booking creation
      const storedReservation = sessionStorage.getItem('pendingReservation');
      if (storedReservation) {
        const navigationState = JSON.parse(storedReservation);
        console.log('Creating booking from Stripe data with stored reservation:', navigationState);
        await this.createRealBooking(navigationState);
        sessionStorage.removeItem('pendingReservation');
      } else {
        console.warn('No stored reservation data found for booking creation');
      }
    } catch (error) {
      console.error('Error creating booking from Stripe data:', error);
    }
  }

  private async createRealBooking(navigationState: any): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) return;

      const property = navigationState.property;
      const reservation = navigationState.reservation;
      const metadata = navigationState.metadata;

      console.log('Creating real booking with data:', { property, reservation, metadata });

      // Ensure we have the correct property ID
      const propertyId = property._id || property.id;
      if (!propertyId) {
        console.error('Property ID missing from navigation state');
        this.error = 'Property information incomplete. Please contact support.';
        this.paymentStatus = 'failed';
        return;
      }

      // Use the original amount from reservation, not converted amount
      const originalAmount = metadata?.originalAmount || navigationState.totalAmount;
      
      const bookingData = {
        property: propertyId,
        tenant: currentUser._id,
        owner: property.owner || property.user || currentUser._id,
        startDate: new Date(reservation.startDate),
        endDate: new Date(reservation.endDate),
        guestCount: reservation.guestCount,
        totalAmount: originalAmount, // Use original calculated amount
        extraGuestSurcharge: metadata.extraGuestSurcharge || 0,
        currency: navigationState.propertyCurrency || 'USD',
        status: 'confirmed' as const,
        paymentStatus: 'paid' as const,
        specialRequests: reservation.specialRequests || '',
        contactInfo: {
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
          phone: reservation.phone
        },
        metadata: {
          rentalDays: metadata.rentalDays || reservation.rentalDays,
          pricePerDay: property.pricing?.price || metadata.pricePerDay || 100,
          stripeSessionId: this.sessionId || this.konnectRef || 'session_' + Date.now(),
          propertyTitle: property.title,
          originalAmount: originalAmount,
          convertedAmount: metadata.convertedAmount,
          originalCurrency: metadata.originalCurrency,
          paymentCurrency: metadata.paymentCurrency
        }
      };

      console.log('Creating booking with data:', bookingData);
      const booking = await firstValueFrom(this.availabilityService.createBooking(bookingData));
      console.log('Booking created successfully:', booking);
      
      // Update payment details to include complete booking info with populated property
      this.paymentDetails.bookingDetails = booking;
      this.paymentDetails.propertyId = property;
      this.paymentDetails.propertyTitle = property.title;
      this.paymentDetails.amount = originalAmount; // Show original amount
      this.paymentDetails.reservationData = reservation;
      
      // Force calendar refresh across all components/tabs
      localStorage.setItem('booking_created', Date.now().toString());
      localStorage.setItem('calendar_refresh_needed', propertyId);
      
      // Trigger a custom event for calendar refresh
      window.dispatchEvent(new CustomEvent('bookingCreated', {
        detail: {
          propertyId: propertyId,
          booking: booking,
          startDate: reservation.startDate,
          endDate: reservation.endDate
        }
      }));
      
    } catch (error) {
      console.error('Error creating real booking:', error);
      // Still create the payment details even if booking fails
      if (navigationState.property) {
        this.paymentDetails.propertyId = navigationState.property;
        this.paymentDetails.propertyTitle = navigationState.property.title;
        this.paymentDetails.amount = navigationState.totalAmount;
        this.paymentDetails.reservationData = navigationState.reservation;
      } else {
        this.error = 'Failed to create booking. Please contact support.';
        this.paymentStatus = 'failed';
      }
    }
  }

  viewReservations(): void {
    this.router.navigate(['/profile'], { fragment: 'reservations' });
  }

  viewProperty(): void {
    if (this.paymentDetails && this.paymentDetails.propertyId) {
      // Extract property ID if propertyId is an object
      const propertyId = typeof this.paymentDetails.propertyId === 'object' 
        ? this.paymentDetails.propertyId._id || this.paymentDetails.propertyId.id
        : this.paymentDetails.propertyId;
      
      if (propertyId) {
        this.router.navigate(['/properties', propertyId]);
      } else {
        this.router.navigate(['/properties']);
      }
    } else {
      this.router.navigate(['/properties']);
    }
  }

  printReservation(): void {
    // Create a print-friendly version
    const printContent = document.getElementById('reservation-details');
    if (printContent) {
      const originalContent = document.body.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reservation Confirmation</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  color: #333;
                }
                .card { 
                  border: 1px solid #ddd; 
                  border-radius: 5px; 
                  padding: 20px; 
                }
                .card-header { 
                  border-bottom: 1px solid #ddd; 
                  margin-bottom: 20px; 
                  padding-bottom: 10px;
                }
                .badge-success { 
                  background-color: #28a745; 
                  color: white; 
                  padding: 3px 6px; 
                  border-radius: 3px; 
                  font-size: 12px;
                }
                .badge-warning { 
                  background-color: #ffc107; 
                  color: black; 
                  padding: 3px 6px; 
                  border-radius: 3px; 
                  font-size: 12px;
                }
                .badge-danger { 
                  background-color: #dc3545; 
                  color: white; 
                  padding: 3px 6px; 
                  border-radius: 3px; 
                  font-size: 12px;
                }
                .text-primary { 
                  color: #007bff; 
                }
                .alert-info { 
                  background-color: #d1ecf1; 
                  border: 1px solid #bee5eb; 
                  border-radius: 4px; 
                  padding: 15px; 
                }
                hr { 
                  border: 0; 
                  height: 1px; 
                  background: #ddd; 
                  margin: 10px 0; 
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Reservation Confirmation</h1>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  }

  calculateNights(): number {
    if (this.paymentDetails?.reservationData?.startDate && this.paymentDetails?.reservationData?.endDate) {
      const start = new Date(this.paymentDetails.reservationData.startDate);
      const end = new Date(this.paymentDetails.reservationData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('Calculating nights:', {
        startDate: start.toDateString(),
        endDate: end.toDateString(),
        diffDays
      });
      return diffDays;
    }
    if (this.paymentDetails?.bookingDetails?.startDate && this.paymentDetails?.bookingDetails?.endDate) {
      const start = new Date(this.paymentDetails.bookingDetails.startDate);
      const end = new Date(this.paymentDetails.bookingDetails.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log('Calculating nights from booking details:', {
        startDate: start.toDateString(),
        endDate: end.toDateString(),
        diffDays
      });
      return diffDays;
    }
    return 1;
  }

  async verifyContractSignatures(): Promise<void> {
    if (!this.contractId) {
      return;
    }

    try {
      console.log('Verifying contract signatures for contract:', this.contractId);
      const verification = await firstValueFrom(this.signatureService.verifyContractSignatures(this.contractId));
      
      if (verification.isValid) {
        console.log('Contract signatures verified successfully');
        // You might want to update UI to show signature verification status
      } else {
        console.warn('Contract signature verification failed:', verification.issues);
      }
    } catch (error) {
      console.error('Error verifying contract signatures:', error);
      // Handle verification error gracefully
    }
  }
}
