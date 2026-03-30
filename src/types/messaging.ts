export interface Message {
  id: string;
  clientId?: string;
  content: string | null;
  senderId: string;
  conversationId?: string; // Optional as it might not be in the list view projection
  createdAt: string | Date;
  messageType?: 'text' | 'media' | 'ppv' | 'tip' | 'image' | 'video' | 'audio' | 'system';
  metadata?: Record<string, unknown>;
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

  // Phase 7: realtime reactions
  reactions?: Array<{
    emoji: string;
    userId: string;
  }>;

  // Phase 2: delivery/read receipts (WS-driven)
  status?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  deliveredAt?: string | Date | null;
  readAt?: string | Date | null;
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
  isMuted?: boolean;
  isFavorite?: boolean;
  isRestricted?: boolean;
  isHidden?: boolean;
  isBlocked?: boolean;
  blockedBy?: string | null;
}
