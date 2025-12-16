export interface Message {
  id: string;
  content: string | null;
  senderId: string;
  conversationId?: string; // Optional as it might not be in the list view projection
  createdAt: string | Date;
  messageType?: 'text' | 'media' | 'ppv';
  media?: Array<{
    id: string;
    originalUrl: string;
    thumbnailUrl?: string | null;
    processedUrl?: string | null;
    mediaType: string;
  }>;
  ppvPrice?: number | null;
  isPaid?: boolean;
  isLocked?: boolean;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  lastMessage?: {
    content: string | null;
    createdAt: string;
  };
  unreadCount: number;
}
