export type NotificationType = 
  | 'payment_received'
  | 'payment_failed' 
  | 'payment_confirmed'
  | 'new_message'
  | 'property_viewed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'viewing_scheduled'
  | 'viewing_reminder'
  | 'document_required'
  | 'property_status_update'
  | 'booking_confirmed'
  | 'new_booking'
  | 'favorite_property_updated'
  | 'property_reviewed'
  | 'post_commented'
  | 'post_reviewed'
  | 'admin_new_property'
  | 'admin_property_updated'
  | 'admin_report_received';export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id?: string; // Frontend ID, mapped from _id
  _id?: string; // MongoDB ID from backend
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead?: boolean;
  relatedId?: string;
  relatedType?: 'property' | 'transaction' | 'message' | 'payment' | 'viewing' | 'booking' | 'post' | 'review' | 'agency' | 'agent';
  scheduledFor?: Date;
  priority: NotificationPriority;
  createdAt: Date; // Make required to avoid undefined issues
  updatedAt: Date; // Make required to avoid undefined issues
  data?: any; // Additional data for frontend processing
}
