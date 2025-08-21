export enum UserRole {
    USER = 'user',
    AGENT = 'agent',
    ADMIN = 'admin'
  }
  
  export enum PropertyType {
    APARTMENT = 'Apartment',
    HOUSE = 'House',
    VILLA = 'Villa',
    BUNGALOW = 'Bungalow',
    STUDIO = 'Studio'
  }
  
  export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    BANK_TRANSFER = 'bank_transfer',
    PAYPAL = 'paypal'
  }
  
  export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded'
  }
  
  export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  
  export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
  }
  
  export enum NotificationType {
    PAYMENT_RECEIVED = 'payment_received',
    PAYMENT_FAILED = 'payment_failed',
    NEW_MESSAGE = 'new_message',
    PROPERTY_VIEWED = 'property_viewed',
    OFFER_RECEIVED = 'offer_received',
    OFFER_ACCEPTED = 'offer_accepted',
    OFFER_REJECTED = 'offer_rejected',
    VIEWING_SCHEDULED = 'viewing_scheduled',
    VIEWING_REMINDER = 'viewing_reminder',
    DOCUMENT_REQUIRED = 'document_required',
    PROPERTY_STATUS_UPDATE = 'property_status_update'
  }
  
  export enum SortOptions {
    AUTHOR = 'author',
    DESCRIPTION = 'description',
    TITLE = 'title',
    LIKES = 'likes',
    PRICE = 'price',
    LOCATION = 'location',
    TYPE = 'type',
    RATING = 'rating',
    DATE = 'date',
    STATUS = 'status',
    AMOUNT = 'amount'
  }