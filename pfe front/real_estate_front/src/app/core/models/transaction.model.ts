export interface Transaction {
    id?: string; // Optional, as MongoDB generates it
    buyer: string; // Reference to User (Buyer)
    seller: string; // Reference to User (Seller)
    property: string; // Reference to Property
    amount: number; // Transaction amount
    status: 'pending' | 'completed' | 'cancelled'; // Default is 'pending'
    createdAt?: Date;
    updatedAt?: Date;
  }
  