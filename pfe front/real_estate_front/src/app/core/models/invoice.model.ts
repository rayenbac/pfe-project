export interface Invoice {
  _id?: string;
  userId: string;
  bookingId?: string;
  contractId?: string;
  invoiceNumber: string;
  type: 'booking' | 'contract' | 'service' | 'commission';
  description: string;
  amount: number;
  currency: string;
  taxAmount?: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  lineItems?: InvoiceLineItem[];
  billingAddress?: Address;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateInvoiceRequest {
  userId: string;
  bookingId?: string;
  contractId?: string;
  type: 'booking' | 'contract' | 'service' | 'commission';
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  lineItems?: InvoiceLineItem[];
  billingAddress?: Address;
}
