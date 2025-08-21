export interface Message {
    sender: string; // User ID
    content: string;
    timestamp?: Date; // Optional, as it defaults to Date.now
    isRead?: boolean;
    attachments?: string[]; // Array of URLs
  }
  