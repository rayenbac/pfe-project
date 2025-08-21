export interface BookingContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface BookingMetadata {
  rentalDays?: number;
  pricePerDay?: number;
  stripeSessionId?: string;
  konnectPaymentId?: string;
}

export interface Booking {
  _id?: string;
  property: string; // Property ID
  tenant: string; // User ID
  owner: string; // User ID
  startDate: Date;
  endDate: Date;
  guestCount: number;
  totalAmount: number;
  extraGuestSurcharge: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  contactInfo: BookingContactInfo;
  metadata?: BookingMetadata;
  createdAt?: Date;
  updatedAt?: Date;
  // Backward compatibility fields for templates
  checkIn?: Date;
  checkOut?: Date;
  totalPrice?: number;
}

// Extended booking interface with populated property details
export interface BookingWithProperty extends Omit<Booking, 'property'> {
  property: {
    _id: string;
    title: string;
    address: string;
    images: string[];
    location: {
      address: string;
      city: string;
      state: string;
    };
    bedrooms: number;
    bathrooms: number;
    area: number;
    [key: string]: any;
  };
}

export interface AvailabilityCalendar {
  date: string;
  available: boolean;
  price: number;
  booked?: boolean;
  blocked?: boolean;
}

export interface DateAvailabilityResponse {
  available: boolean;
  blockedDates: string[];
}
