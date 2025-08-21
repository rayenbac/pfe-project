export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export interface SocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  pinterest?: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Combined first and last name for backward compatibility
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  address?: string;
  profileImage?: string;
  avatar?: string; // Alias for profileImage
  verificationImage?: string;
  description?: string; // Agent description/bio
  bio?: string; // Alias for description
  isVerified: boolean;
  agentType?: 'particular' | 'professional';
  agencyId?: string;
  createdAt: Date;
  updatedAt: Date;
  status?: 'online' | 'offline';
  // Social media fields
  socialMedia?: SocialMedia;
  website?: string;
  skype?: string;
  // User preferences
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    privacyMode: boolean;
  };
  // User blocking fields
  isBlocked?: boolean;
  blockReason?: string;
  blockedBy?: string;
  blockedAt?: Date;
  reportCount?: number;
}