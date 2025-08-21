import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { StripeService } from '../../../core/services/stripe.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property } from '../../../core/models/property.model';
import { PaymentDataService } from '../../../core/services/payment-data.service';
import { KonnectService } from '../../../core/services/konnect.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  property: Property | null = null;
  reservation: any = null;
  totalAmount: number = 0;
  displayAmount: number = 0;
  displayCurrency: string = 'USD';
  propertyCurrency: string = 'USD';
  metadata: any = {};
  paymentMethod: 'stripe' | 'konnect' = 'stripe';
  loading = false;
  error: string | null = null;
  currentUser: any = null;
  exchangeRates: any = { USD: 1, TND: 3.2, EUR: 0.85 };

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private stripeService: StripeService,
    private authService: AuthService,
    private paymentDataService: PaymentDataService,
    private konnectService: KonnectService,
    private http: HttpClient
  ) {
    this.checkoutForm = this.fb.group({
      cardholderName: ['', Validators.required],
      billingAddress: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue]
    });

    // Get data from router state OR session storage
    const navigation = this.router.getCurrentNavigation();
    let stateData = navigation?.extras.state;
    
    // If no navigation state, try to get from session storage
    if (!stateData) {
      const storedReservation = sessionStorage.getItem('pendingReservation');
      if (storedReservation) {
        try {
          const parsedData = JSON.parse(storedReservation);
          stateData = parsedData;
          console.log('Retrieved checkout data from session storage:', stateData);
        } catch (error) {
          console.error('Error parsing session storage data:', error);
        }
      }
    }
    
    if (stateData) {
      this.property = stateData['property'];
      this.reservation = stateData['reservation'];
      this.totalAmount = stateData['totalAmount']; // Use exact amount from reservation
      this.metadata = stateData['metadata'];
      this.paymentMethod = stateData['paymentMethod'] || 'stripe';
      this.propertyCurrency = stateData['propertyCurrency'] || 'USD';
      this.exchangeRates = stateData['exchangeRates'] || { TND: 1, USD: 1, EUR: 1 };
      
      console.log('DEBUG - Checkout initialized with:', {
        totalAmount: this.totalAmount,
        propertyCurrency: this.propertyCurrency,
        paymentMethod: this.paymentMethod,
        property: this.property?.title,
        exchangeRates: this.exchangeRates
      });
      
      // Fetch real-time exchange rates
      this.fetchExchangeRates(this.propertyCurrency);
      
      console.log('Checkout initialized with data:', {
        totalAmount: this.totalAmount,
        propertyCurrency: this.propertyCurrency,
        property: this.property?.title
      });
      
      this.setDisplayAmount();
    } else {
      console.error('No checkout data available, redirecting to properties');
      this.router.navigate(['/properties']);
    }
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      console.error('User not authenticated');
      this.router.navigate(['/login']);
      return;
    }
  }

  async fetchExchangeRates(baseCurrency: string = 'USD'): Promise<void> {
    try {
      // Always fetch rates with USD as base for consistency
      const response = await this.http.get<any>('https://api.exchangerate.host/latest?base=USD&symbols=TND,EUR').toPromise();
      if (response && response.rates) {
        // Set up exchange rates with USD as base
        this.exchangeRates = {
          USD: 1,
          TND: response.rates.TND || 3.2,
          EUR: response.rates.EUR || 0.85
        };
        console.log('Fetched real-time exchange rates:', this.exchangeRates);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using fallback:', error);
      // Fallback rates with USD as base
      this.exchangeRates = {
        USD: 1,
        TND: 3.2,
        EUR: 0.85
      };
    }
    this.setDisplayAmount();
  }

  setDisplayAmount(): void {
    // The totalAmount should ALWAYS be the original amount calculated in reservation
    // We only show conversion for payment method, but don't change the displayed amount
    
    const baseAmount = this.totalAmount; // This is the amount calculated in reservation
    
    // Always display the ORIGINAL amount from reservation, regardless of payment method
    this.displayAmount = baseAmount;
    this.displayCurrency = this.propertyCurrency;
    
    console.log('Display amount set:', {
      originalAmount: this.totalAmount,
      displayAmount: this.displayAmount,
      displayCurrency: this.displayCurrency,
      propertyCurrency: this.propertyCurrency,
      paymentMethod: this.paymentMethod
    });
  }

  onPaymentMethodChange(method: 'stripe' | 'konnect'): void {
    this.paymentMethod = method;
    this.setDisplayAmount();
  }

  async onSubmit(): Promise<void> {
    if (!this.checkoutForm.valid) {
      console.log('Form is invalid:', this.checkoutForm.errors);
      return;
    }

    this.loading = true;
    try {
      if (this.paymentMethod === 'konnect') {
        await this.processKonnectPayment();
      } else {
        await this.processStripePayment();
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      this.loading = false;
      
      Swal.fire({
        title: 'Payment Error',
        text: error.message || 'An error occurred while processing your payment. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  private async processKonnectPayment(): Promise<void> {
    // Null safety check
    if (!this.property) {
      throw new Error('Property information is missing');
    }
    
    // Calculate TND amount for Konnect payment processor
    let amountTND = this.totalAmount; // Start with original amount
    
    // Only convert if property currency is NOT TND (case-insensitive)
    if (this.propertyCurrency.toUpperCase() !== 'TND') {
      // Convert from property currency to TND
      if (this.propertyCurrency.toUpperCase() === 'USD') {
        // Convert USD to TND: multiply by TND rate
        amountTND = +(this.totalAmount * this.exchangeRates['TND']).toFixed(2);
      } else if (this.propertyCurrency.toUpperCase() === 'EUR') {
        // Convert EUR to USD first, then to TND
        const amountUSD = this.totalAmount / this.exchangeRates['EUR'];
        amountTND = +(amountUSD * this.exchangeRates['TND']).toFixed(2);
      }
      // Add more currencies as needed
    }
    // If property currency is TND, keep amountTND = this.totalAmount (no conversion needed)
    
    // Show currency conversion confirmation only if currencies are different
    if (this.propertyCurrency.toUpperCase() !== 'TND') {
      let exchangeRateText = '';
      if (this.propertyCurrency.toUpperCase() === 'USD') {
        exchangeRateText = `1 USD = ${this.exchangeRates['TND']} TND`;
      } else if (this.propertyCurrency.toUpperCase() === 'EUR') {
        exchangeRateText = `1 EUR = ${(this.exchangeRates['TND'] / this.exchangeRates['EUR']).toFixed(3)} TND`;
      }
      
      const result = await Swal.fire({
        title: 'Currency Conversion',
        html: `
          <p>Original Amount: <strong>${this.propertyCurrency} ${this.totalAmount.toFixed(2)}</strong></p>
          <p>Payment Amount: <strong>TND ${amountTND.toFixed(2)}</strong></p>
          <small class="text-muted">Rate: ${exchangeRateText}</small>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Proceed with Payment',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        this.loading = false;
        return;
      }
    }
    
    console.log('Konnect payment - Amount conversion:', {
      originalAmount: this.totalAmount,
      originalCurrency: this.propertyCurrency,
      convertedAmount: amountTND,
      exchangeRate: this.exchangeRates['TND']
    });
    
    // Store reservation data in session storage before Konnect redirect
    const reservationSession = {
      property: this.property,
      reservation: this.reservation,
      totalAmount: this.totalAmount, // Original amount
      displayAmount: amountTND, // Converted amount for payment
      metadata: {
        ...this.metadata,
        originalAmount: this.totalAmount,
        convertedAmount: amountTND,
        originalCurrency: this.propertyCurrency,
        paymentCurrency: 'TND',
        exchangeRate: this.exchangeRates['TND'],
        sessionId: Date.now().toString(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      propertyCurrency: this.propertyCurrency,
      exchangeRates: this.exchangeRates,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingReservation', JSON.stringify(reservationSession));
    
    // Store additional session data for Konnect
    sessionStorage.setItem('konnectPaymentSession', JSON.stringify({
      sessionId: Date.now().toString(),
      userId: this.currentUser._id,
      propertyId: this.property._id,
      amount: amountTND,
      timestamp: Date.now()
    }));
    
    const konnectReq = {
      propertyId: this.property._id,
      userId: this.currentUser._id,
      agentId: this.property.owner,
      amount: amountTND,
      currency: 'TND',
      userEmail: this.currentUser.email,
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      phoneNumber: this.currentUser.phone,
      metadata: {
        propertyTitle: this.property.title,
        startDate: this.reservation.startDate,
        endDate: this.reservation.endDate,
        rentalDays: this.reservation.rentalDays,
        guestCount: this.reservation.guestCount,
        billingAddress: this.checkoutForm.value.billingAddress,
        city: this.checkoutForm.value.city,
        state: this.checkoutForm.value.state,
        postalCode: this.checkoutForm.value.postalCode,
        country: this.checkoutForm.value.country,
        sessionId: Date.now().toString(),
        originalAmount: this.totalAmount,
        convertedAmount: amountTND,
        originalCurrency: this.propertyCurrency,
        paymentCurrency: 'TND',
        exchangeRate: this.exchangeRates['TND']
      }
    };
    
    const resp = await firstValueFrom(this.konnectService.createPayment(konnectReq));
    
    // Add a small delay to ensure session storage is written
    setTimeout(() => {
      window.location.href = resp.paymentUrl;
    }, 100);
  }

  private async processStripePayment(): Promise<void> {
    // Null safety check
    if (!this.property) {
      throw new Error('Property information is missing');
    }
    
    console.log('DEBUG - Stripe payment processing:', {
      totalAmount: this.totalAmount,
      propertyCurrency: this.propertyCurrency,
      paymentMethod: this.paymentMethod
    });
    
    // Calculate USD amount for Stripe payment processor
    let amountUSD = this.totalAmount; // Start with original amount
    
    // Only convert if property currency is NOT USD (case-insensitive)
    if (this.propertyCurrency.toUpperCase() !== 'USD') {
      console.log('DEBUG - Currency conversion needed from', this.propertyCurrency, 'to USD');
      // Convert from property currency to USD
      if (this.propertyCurrency.toUpperCase() === 'TND') {
        // Convert TND to USD: divide by TND rate
        amountUSD = +(this.totalAmount / this.exchangeRates['TND']).toFixed(2);
      } else if (this.propertyCurrency.toUpperCase() === 'EUR') {
        // Convert EUR to USD: divide by EUR rate
        amountUSD = +(this.totalAmount / this.exchangeRates['EUR']).toFixed(2);
      }
      // Add more currencies as needed
    } else {
      console.log('DEBUG - No currency conversion needed, property already in USD');
    }
    // If property currency is USD, keep amountUSD = this.totalAmount (no conversion needed)
    
    console.log('DEBUG - Final amounts:', {
      originalAmount: this.totalAmount,
      convertedAmount: amountUSD,
      willShowDialog: this.propertyCurrency.toUpperCase() !== 'USD'
    });
    
    // Show currency conversion confirmation only if currencies are different
    if (this.propertyCurrency.toUpperCase() !== 'USD') {
      let exchangeRateText = '';
      if (this.propertyCurrency.toUpperCase() === 'TND') {
        exchangeRateText = `1 USD = ${this.exchangeRates['TND']} TND`;
      } else if (this.propertyCurrency.toUpperCase() === 'EUR') {
        exchangeRateText = `1 USD = ${this.exchangeRates['EUR']} EUR`;
      }
      
      const result = await Swal.fire({
        title: 'Currency Conversion',
        html: `
          <p>Original Amount: <strong>${this.propertyCurrency} ${this.totalAmount.toFixed(2)}</strong></p>
          <p>Payment Amount: <strong>USD ${amountUSD.toFixed(2)}</strong></p>
          <small class="text-muted">Rate: ${exchangeRateText}</small>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Proceed with Payment',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        this.loading = false;
        return;
      }
    }
    
    console.log('Stripe payment - Amount conversion:', {
      originalAmount: this.totalAmount,
      originalCurrency: this.propertyCurrency,
      convertedAmount: amountUSD,
      exchangeRate: this.exchangeRates['TND']
    });
    
    const paymentSession = {
      propertyId: this.property._id,
      userId: this.currentUser._id,
      agentId: this.property.owner,
      amount: amountUSD,
      currency: 'USD',
      metadata: {
        propertyTitle: this.property.title,
        startDate: this.reservation.startDate,
        endDate: this.reservation.endDate,
        rentalDays: this.reservation.rentalDays,
        guestCount: this.reservation.guestCount,
        billingAddress: this.checkoutForm.value.billingAddress,
        city: this.checkoutForm.value.city,
        state: this.checkoutForm.value.state,
        postalCode: this.checkoutForm.value.postalCode,
        country: this.checkoutForm.value.country,
        userEmail: this.currentUser.email,
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        phoneNumber: this.currentUser.phone,
        originalAmount: this.totalAmount,
        convertedAmount: amountUSD,
        originalCurrency: this.propertyCurrency,
        paymentCurrency: 'USD',
        exchangeRate: this.exchangeRates['TND']
      }
    };

    const response = await firstValueFrom(this.stripeService.createCheckoutSession(paymentSession));
    
    if (response && response.url) {
      // Store reservation data before redirect
      const reservationSession = {
        property: this.property,
        reservation: this.reservation,
        totalAmount: this.totalAmount,
        metadata: paymentSession.metadata,
        propertyCurrency: this.propertyCurrency,
        exchangeRates: this.exchangeRates,
        timestamp: Date.now()
      };
      sessionStorage.setItem('pendingReservation', JSON.stringify(reservationSession));
      
      window.location.href = response.url;
    } else {
      throw new Error('Failed to create Stripe checkout session');
    }
  }
}
