export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentDetails {
  cardLastFour?: string;
  bankName?: string;
  accountLastFour?: string;
  paypalEmail?: string;
}

export interface Payment {
  id?: string; // Optional, as MongoDB generates it
  transactionId: string; // Reference to Transaction
  amount: number;
  currency: string;
  method: PaymentMethod;
  status?: PaymentStatus; // Default is 'pending'
  paymentDate?: Date;
  paymentDetails: PaymentDetails;
  createdAt?: Date;
  updatedAt?: Date;
}
