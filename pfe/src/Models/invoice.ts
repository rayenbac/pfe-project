import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoice extends Document {
    _id: Types.ObjectId;
    invoiceNumber: string;
    bookingId: Types.ObjectId;
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
    agentId: Types.ObjectId;
    invoiceDate: Date;
    dueDate: Date;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    amount: {
        subtotal: number;
        tax: number;
        fees: number;
        total: number;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    billingAddress: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    paymentDate?: Date;
    pdfUrl?: string;
    notes?: string;
    metadata: {
        checkInDate: Date;
        checkOutDate: Date;
        nights: number;
        guests: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        default: () => `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    propertyId: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    agentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    amount: {
        subtotal: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        fees: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    items: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    billingAddress: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'USA' }
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentDate: {
        type: Date
    },
    pdfUrl: {
        type: String
    },
    notes: {
        type: String
    },
    metadata: {
        checkInDate: { type: Date, required: true },
        checkOutDate: { type: Date, required: true },
        nights: { type: Number, required: true },
        guests: { type: Number, required: true }
    }
}, {
    timestamps: true
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ agentId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });

// Virtual for property details
invoiceSchema.virtual('booking', {
    ref: 'Booking',
    localField: 'bookingId',
    foreignField: '_id',
    justOne: true
});

invoiceSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

invoiceSchema.virtual('property', {
    ref: 'Property',
    localField: 'propertyId',
    foreignField: '_id',
    justOne: true
});

invoiceSchema.virtual('agent', {
    ref: 'User',
    localField: 'agentId',
    foreignField: '_id',
    justOne: true
});

// Methods
invoiceSchema.methods.markAsPaid = function(paymentDate?: Date) {
    this.status = 'paid';
    this.paymentDate = paymentDate || new Date();
    return this.save();
};

invoiceSchema.methods.markAsOverdue = function() {
    if (this.status === 'sent' && new Date() > this.dueDate) {
        this.status = 'overdue';
        return this.save();
    }
    return this;
};

// Static methods
invoiceSchema.statics.generateInvoiceNumber = function() {
    return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

invoiceSchema.statics.findByUser = function(userId: string) {
    return this.find({ userId })
        .populate('booking')
        .populate('property', 'title address images')
        .populate('agent', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

invoiceSchema.statics.findByAgent = function(agentId: string) {
    return this.find({ agentId })
        .populate('booking')
        .populate('property', 'title address images')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

// Pre-save middleware
invoiceSchema.pre('save', function(next) {
    // Calculate total if items changed
    if (this.isModified('items') || this.isModified('amount.tax') || this.isModified('amount.fees')) {
        const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
        this.amount.subtotal = subtotal;
        this.amount.total = subtotal + (this.amount.tax || 0) + (this.amount.fees || 0);
    }
    
    // Auto-generate invoice number if not set
    if (!this.invoiceNumber) {
        this.invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }
    
    next();
});

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
