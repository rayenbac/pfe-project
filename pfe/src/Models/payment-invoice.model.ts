import { Schema, model, Document, Types } from 'mongoose';

export interface IPaymentInvoice extends Document {
  _id: Types.ObjectId;
  agentId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  contractId?: Types.ObjectId;
  invoiceNumber: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  commissionRate: number;
  commission: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  clientInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  itemsBreakdown?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentInvoiceSchema = new Schema<IPaymentInvoice>({
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  contractId: {
    type: Schema.Types.ObjectId,
    ref: 'Contract'
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  commissionRate: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String
  },
  paymentReference: {
    type: String
  },
  clientInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: String
  },
  itemsBreakdown: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  notes: String,
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentInvoiceSchema.index({ agentId: 1, status: 1 });
paymentInvoiceSchema.index({ invoiceNumber: 1 });
paymentInvoiceSchema.index({ dueDate: 1 });
paymentInvoiceSchema.index({ createdAt: -1 });

// Pre-save middleware to generate invoice number
paymentInvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await PaymentInvoice.countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const PaymentInvoice = model<IPaymentInvoice>('PaymentInvoice', paymentInvoiceSchema);
