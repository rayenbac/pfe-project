import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { StripeService } from '../../../core/services/stripe.service';
import { AvailabilityService } from '../../../core/services/availability.service';
import { Property } from '../../../core/models/property.model';
import { AvailabilityCalendarComponent } from '../../../shared/components/availability-calendar/availability-calendar.component';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, AvailabilityCalendarComponent],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {
  property: Property | null = null;
  reservationForm: FormGroup;
  loading = false;
  error: string | null = null;
  currentUser: any;
  totalAmount = 0;
  rentalDays = 1;
  guestCount = 1;
  paymentMethod: 'stripe' | 'konnect' = 'stripe';
  extraGuestSurcharge = 0;
  currency: string = 'TND';
  exchangeRates: { [key: string]: number } = { USD: 1, TND: 1 };
  
  // Calendar properties
  showCalendar = true;
  selectedDates: {startDate: string, endDate: string, nights: number} | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private authService: AuthService,
    private stripeService: StripeService,
    private availabilityService: AvailabilityService,
    private http: HttpClient
  ) {
    this.reservationForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      guestCount: [1, [Validators.required, Validators.min(1)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      specialRequests: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to make a reservation',
        icon: 'warning',
        confirmButtonText: 'Log In'
      }).then(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      });
      return;
    }

    // Pre-fill user information
    this.reservationForm.patchValue({
      firstName: this.currentUser.firstName,
      lastName: this.currentUser.lastName,
      email: this.currentUser.email,
      phone: this.currentUser.phone || ''
    });

    // Get property ID from route parameters
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (propertyId) {
      this.loadProperty(propertyId);
    } else {
      this.error = 'Property ID is missing';
    }

    // Update rental days and total amount when start or end date changes
    this.reservationForm.get('startDate')?.valueChanges.subscribe(() => {
      this.updateRentalDays();
      this.calculateTotalAmount();
    });
    this.reservationForm.get('endDate')?.valueChanges.subscribe(() => {
      this.updateRentalDays();
      this.calculateTotalAmount();
    });
    this.reservationForm.get('guestCount')?.valueChanges.subscribe(value => {
      this.guestCount = value;
      this.calculateTotalAmount();
    });

    // Set property currency for use in checkout
    if (this.property && this.property.pricing && this.property.pricing.currency) {
      this.currency = this.property.pricing.currency;
    }
    
    // Listen for booking creation events to refresh calendar
    window.addEventListener('bookingCreated', (e: any) => {
      console.log('Booking created, refreshing calendar');
      // Force calendar refresh
      this.showCalendar = true;
    });
  }

  loadProperty(id: string): void {
    this.loading = true;
    this.propertyService.getProperty(id).subscribe({
      next: (property) => {
        // Check if property is for rent
        if (property.listingType !== 'rent' && property.listingType !== 'both') {
          Swal.fire({
            title: 'Not Available for Rent',
            text: 'This property is not available for rent',
            icon: 'error',
            confirmButtonText: 'Back to Property'
          }).then(() => {
            this.router.navigate(['/properties', id]);
          });
          return;
        }

        this.property = property;
        this.currency = property.pricing.currency;
        this.fetchExchangeRates(this.currency);
        this.calculateTotalAmount();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading property details';
        this.loading = false;
        console.error('Error loading property:', error);
      }
    });
  }

  fetchExchangeRates(baseCurrency: string): void {
    this.http.get<any>(`https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=USD,TND`).subscribe(
      res => {
        this.exchangeRates = res.rates;
      },
      err => {
        // fallback: 1 for base, 3.2 for TND if base is USD, 0.31 for USD if base is TND
        this.exchangeRates = baseCurrency === 'USD'
          ? { USD: 1, TND: 3.2 }
          : { USD: 0.31, TND: 1 };
      }
    );
  }

  updateRentalDays(): void {
    const start = this.reservationForm.get('startDate')?.value;
    const end = this.reservationForm.get('endDate')?.value;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      // Calculate days difference (number of nights stayed)
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.rentalDays = diffDays > 0 ? diffDays : 1;
      
      console.log('Duration calculation:', {
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
        diffTime,
        diffDays,
        rentalDays: this.rentalDays
      });
    } else {
      this.rentalDays = 1;
    }
  }

  calculateTotalAmount(): void {
    if (this.property && this.property.pricing && this.property.pricing.price) {
      const pricePerDay = this.property.pricing.price;
      const days = this.rentalDays;
      const allowedGuests = (this.property.bedrooms || 1) * 2;
      const extraGuests = Math.max(0, this.guestCount - allowedGuests);
      this.extraGuestSurcharge = extraGuests > 0 ? 0.1 * pricePerDay * extraGuests * days : 0;
      this.totalAmount = +(pricePerDay * days + this.extraGuestSurcharge).toFixed(2);
    }
  }

  // Calendar event handlers
  onDateRangeSelected(dateRange: {startDate: string, endDate: string, nights: number}) {
    this.selectedDates = dateRange;
    this.reservationForm.patchValue({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    this.rentalDays = dateRange.nights;
    this.calculateTotalAmount();
    this.showCalendar = false; // Hide calendar after selection
  }

  onDateRangeCleared() {
    this.selectedDates = null;
    this.reservationForm.patchValue({
      startDate: '',
      endDate: ''
    });
    this.rentalDays = 1;
    this.calculateTotalAmount();
  }

  onIndividualDatesSelected(selectedDates: string[]) {
    console.log('Individual dates selected:', selectedDates);
    // For individual mode, we'll treat each selected date as a separate booking
    // For now, let's just update the form with the first and last selected dates
    if (selectedDates.length > 0) {
      const sortedDates = selectedDates.sort();
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
      
      this.selectedDates = {
        startDate: startDate,
        endDate: endDate,
        nights: selectedDates.length
      };
      
      this.reservationForm.patchValue({
        startDate: startDate,
        endDate: endDate
      });
      
      this.rentalDays = selectedDates.length;
      this.calculateTotalAmount();
      this.showCalendar = false;
    }
  }

  showCalendarAgain() {
    this.showCalendar = true;
  }

  onSubmit(): void {
    if (this.reservationForm.invalid || !this.property) {
      return;
    }
    this.loading = true;
    const formData = this.reservationForm.value;
    
    // Create metadata for the payment with complete property information
    const metadata = {
      startDate: formData.startDate,
      endDate: formData.endDate,
      rentalDays: this.rentalDays,
      guestCount: formData.guestCount,
      specialRequests: formData.specialRequests || '',
      extraGuestSurcharge: this.extraGuestSurcharge,
      propertyId: this.property._id,
      propertyTitle: this.property.title,
      propertyPrice: this.property.pricing.price,
      pricePerDay: this.property.pricing.price,
      totalAmountOriginal: this.totalAmount, // Store original calculated amount
      currency: this.currency
    };

    // Create complete reservation object with property reference
    const completeReservation = {
      ...formData,
      propertyId: this.property._id,
      propertyTitle: this.property.title,
      totalAmount: this.totalAmount,
      rentalDays: this.rentalDays,
      originalAmount: this.totalAmount, // Keep original amount for consistency
      calculatedTotalAmount: this.totalAmount, // Explicitly store calculated amount
      currency: this.currency
    };
    
    console.log('Navigating to checkout with data:', {
      property: this.property,
      reservation: completeReservation,
      totalAmount: this.totalAmount,
      metadata: metadata
    });
    
    // Store reservation data in session storage for Stripe redirect
    const reservationSession = {
      property: this.property,
      reservation: completeReservation,
      totalAmount: this.totalAmount,
      metadata: metadata,
      propertyCurrency: this.currency,
      exchangeRates: this.exchangeRates,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingReservation', JSON.stringify(reservationSession));
    
    // Proceed to contract signing and checkout flow
    this.router.navigate(['/checkout/contract'], {
      state: {
        property: this.property,
        reservation: completeReservation,
        totalAmount: this.totalAmount,
        metadata: metadata,
        propertyCurrency: this.currency,
        exchangeRates: this.exchangeRates
      }
    });
  }
}