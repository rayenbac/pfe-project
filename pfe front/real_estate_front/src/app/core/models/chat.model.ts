import { User } from './user.model';
import { Property } from './property.model';

export interface Message {
  _id?: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

export interface Chat {
  _id?: string;
  participants: (string | User)[];
  propertyId: string | Property;
  messages: Message[];
  lastMessage?: Message;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}