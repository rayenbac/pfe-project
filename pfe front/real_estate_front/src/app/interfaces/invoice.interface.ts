export interface Invoice {
  _id: string;
  invoiceNumber: string;
  bookingId: string;
  userId: string;
  propertyId: string;
  agentId: string;
  status: 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: Date;
  dueDate: Date;
  amount: {
    subtotal: number;
    tax: number;
    fees: number;
    total: number;
  };
  items: InvoiceItem[];
  billingAddress: BillingAddress;
  paymentMethod: string;
  paymentDate?: Date;
  pdfUrl?: string;
  metadata: {
    checkInDate: Date;
    checkOutDate: Date;
    nights: number;
    guests: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Populated fields
  booking?: any;
  user?: any;
  property?: any;
  agent?: any;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface InvoiceStats {
  overview: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueCount: number;
  };
  statusBreakdown: Array<{
    _id: string;
    count: number;
    amount: number;
  }>;
}

export interface InvoiceFilters {
  status?: string;
  userId?: string;
  agentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
