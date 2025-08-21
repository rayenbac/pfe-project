import { Document, Types } from 'mongoose';
import { UserRole } from '../../Constants/enums';

export interface ISocialMedia {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    pinterest?: string;
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
    address?: string;
    description?: string; // Agent description/bio
    profileImage: string;
    verificationImage: string;
    isVerified: boolean;
    agentType?: 'particular' | 'professional';
    agencyId?: Types.ObjectId;
    socialMedia?: ISocialMedia;
    website?: string;
    // Electronic signature interface for agents
    digitalSignature?: {
        signatureImage?: string; // Base64 encoded signature image
        signatureFont?: string; // Font style for typed signatures
        signatureText?: string; // Typed signature text
        signatureType?: 'drawn' | 'typed' | 'uploaded';
        uploadedAt?: Date;
        isActive?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
    posts: Types.ObjectId[];
    
    // User blocking fields
    isBlocked?: boolean;
    blockReason?: string;
    blockedBy?: Types.ObjectId;
    blockedAt?: Date;
    reportCount?: number;
}