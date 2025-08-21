import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StripeService } from '../../../core/services/stripe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property } from '../../../core/models/property.model';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { PaymentDataService } from '../../../core/services/payment-data.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent implements OnInit {
  property: Property | null = null;
  reservation: any = null;
  totalAmount = 0;
  loading = false;
  error: string | null = null;
  currentUser: any;

  constructor(
    private router: Router,
    private stripeService: StripeService,
    private authService: AuthService,
    private paymentDataService: PaymentDataService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.loading = true;
      this.currentUser = this.authService.getCurrentUser();
      
      const state = this.paymentDataService.get();
      if (!state) {
        throw new Error('Payment session expired');
      }

      this.property = state.property;
      this.reservation = state.reservation;
      this.totalAmount = state.totalAmount;
    } catch (error: any) {
      console.error('Initialization error:', error);
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  async handlePayment(): Promise<void> {
    try {
      this.loading = true;
      
      // Create payment session
      const session = await firstValueFrom(this.stripeService.createCheckoutSession({
        propertyId: this.property!._id,
        userId: this.currentUser._id,
        agentId: this.property!.owner,
        amount: this.totalAmount,
        currency: this.property!.pricing.currency || 'usd',
        metadata: {
          propertyTitle: this.property!.title,
          startDate: this.reservation.startDate,
          endDate: this.reservation.endDate,
          rentalPeriod: this.reservation.rentalPeriod
        }
      }));

      // Redirect to Stripe Checkout
      window.location.href = session.url;
      
    } catch (error: any) {
      console.error('Payment error:', error);
      this.error = error.message || 'Failed to initialize payment';
    } finally {
      this.loading = false;
    }
  }

  cancelPayment(): void {
    Swal.fire({
      title: 'Cancel Payment',
      text: 'Are you sure you want to cancel this payment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No, continue'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/properties', this.property?._id]);
      }
    });
  }
}
