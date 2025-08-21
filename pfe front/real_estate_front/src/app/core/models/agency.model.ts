export interface Agency {
    _id: string;
    name: string;
    description: string;
    logo?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    licenseNumber: string;
    foundedYear: number;
    isVerified: boolean;
    ownerId: string;
    socialMedia?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
    workingHours?: {
        monday?: string;
        tuesday?: string;
        wednesday?: string;
        thursday?: string;
        friday?: string;
        saturday?: string;
        sunday?: string;
    };
    services?: string[];
    specializations?: string[];
    rating: number;
    totalReviews: number;
    status: 'active' | 'inactive' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
} 