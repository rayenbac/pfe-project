export interface KonnectPaymentRequest {
  propertyId: string;
  userId: string;
  agentId: string;
  amount: number;
  currency?: string;
  metadata?: {
    userEmail?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    [key: string]: any;
  };
}

export interface KonnectPaymentResponse {
  paymentUrl: string;
  paymentId: string;
} 