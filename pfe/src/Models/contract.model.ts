import { Schema, model, Document, Types } from 'mongoose';

export interface IRentalContractDetails {
  // Property Details
  propertyAddress: string;
  propertyType: string;
  propertyDescription: string;
  numberOfRooms?: number;
  furnished: boolean;
  propertySize?: number;
  includedEquipment?: string[];
  
  // Parties Details
  ownerDetails: {
    fullName: string;
    cinPassportNumber: string;
    address: string;
    phone?: string;
    email?: string;
  };
  tenantDetails: {
    fullName: string;
    cinPassportNumber: string;
    address: string;
    phone?: string;
    email?: string;
  };
  
  // Financial Terms
  rentAmount: number;
  paymentFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  paymentMethod: 'online' | 'offline' | 'bank_transfer' | 'cash';
  securityDeposit: number;
  securityDepositRefundConditions: string;
  latePenalties?: {
    enabled: boolean;
    amount?: number;
    percentage?: number;
    gracePeriod?: number; // days
  };
  
  // Rental Duration & Termination
  renewalConditions: 'automatic' | 'by_agreement' | 'fixed_term';
  terminationNotice: number; // days
  earlyTerminationConditions: string;
  
  // Responsibilities & Usage
  tenantObligations: string[];
  ownerObligations: string[];
  authorizedUse: string;
  restrictions: string[];
  petsAllowed: boolean;
  smokingAllowed: boolean;
  sublettingAllowed: boolean;
  
  // Inspection
  initialInspectionReport?: string;
  finalInspectionRequired: boolean;
  
  // Legal
  applicableLaw: string;
  jurisdiction: string;
  disputeResolution: 'court' | 'arbitration' | 'mediation';
}

export interface IContract extends Document {
  _id: Types.ObjectId;
  agentId: Types.ObjectId;
  clientId: Types.ObjectId;
  propertyId: Types.ObjectId;
  type: 'sale' | 'rental' | 'management';
  title: string;
  description: string;
  terms: string;
  amount: number;
  currency: string;
  commissionRate: number;
  commission: number;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed' | 'refunded';
  reservationType: 'online' | 'offline';
  signedByAgent: boolean;
  signedByClient: boolean;
  agentSignatureDate?: Date;
  clientSignatureDate?: Date;
  
  // Enhanced rental contract details
  rentalDetails?: IRentalContractDetails;
  
  // Enhanced signature data
  agentSignature?: {
    signatureImage: string; // Base64 encoded signature
    signatureType: 'drawn' | 'typed' | 'uploaded';
    signedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
  clientSignature?: {
    signatureImage: string; // Base64 encoded signature
    signatureType: 'drawn' | 'typed' | 'uploaded';
    signedAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
  signedDocumentUrl?: string; // URL to the final signed PDF document
  documents?: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IContract>({
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  type: {
    type: String,
    enum: ['sale', 'rental', 'management'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  terms: {
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'completed', 'cancelled', 'expired'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'failed', 'refunded'],
    default: 'pending'
  },
  reservationType: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  signedByAgent: {
    type: Boolean,
    default: false
  },
  signedByClient: {
    type: Boolean,
    default: false
  },
  agentSignatureDate: {
    type: Date
  },
  clientSignatureDate: {
    type: Date
  },
  
  // Enhanced rental contract details
  rentalDetails: {
    propertyAddress: { type: String },
    propertyType: { type: String },
    propertyDescription: { type: String },
    numberOfRooms: { type: Number },
    furnished: { type: Boolean, default: false },
    propertySize: { type: Number },
    includedEquipment: [{ type: String }],
    
    ownerDetails: {
      fullName: { type: String },
      cinPassportNumber: { type: String },
      address: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    tenantDetails: {
      fullName: { type: String },
      cinPassportNumber: { type: String },
      address: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    
    rentAmount: { type: Number },
    paymentFrequency: { 
      type: String, 
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    paymentMethod: { 
      type: String, 
      enum: ['online', 'offline', 'bank_transfer', 'cash'],
      default: 'online'
    },
    securityDeposit: { type: Number, default: 0 },
    securityDepositRefundConditions: { type: String },
    latePenalties: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number },
      percentage: { type: Number },
      gracePeriod: { type: Number, default: 3 }
    },
    
    renewalConditions: { 
      type: String, 
      enum: ['automatic', 'by_agreement', 'fixed_term'],
      default: 'by_agreement'
    },
    terminationNotice: { type: Number, default: 30 },
    earlyTerminationConditions: { type: String },
    
    tenantObligations: [{ type: String }],
    ownerObligations: [{ type: String }],
    authorizedUse: { type: String, default: 'Residential use only' },
    restrictions: [{ type: String }],
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    sublettingAllowed: { type: Boolean, default: false },
    
    initialInspectionReport: { type: String },
    finalInspectionRequired: { type: Boolean, default: true },
    
    applicableLaw: { type: String, default: 'Tunisian Law' },
    jurisdiction: { type: String, default: 'Tunisia' },
    disputeResolution: { 
      type: String, 
      enum: ['court', 'arbitration', 'mediation'],
      default: 'court'
    }
  },
  // Enhanced signature data
  agentSignature: {
    signatureImage: { type: String }, // Base64 encoded signature
    signatureType: { 
      type: String, 
      enum: ['drawn', 'typed', 'uploaded'],
      required: false 
    },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  clientSignature: {
    signatureImage: { type: String }, // Base64 encoded signature
    signatureType: { 
      type: String, 
      enum: ['drawn', 'typed', 'uploaded'],
      required: false 
    },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  signedDocumentUrl: {
    type: String // URL to the final signed PDF document
  },
  documents: [{
    type: String
  }],
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
contractSchema.index({ agentId: 1, status: 1 });
contractSchema.index({ clientId: 1, status: 1 });
contractSchema.index({ propertyId: 1 });
contractSchema.index({ createdAt: -1 });

export const Contract = model<IContract>('Contract', contractSchema);
