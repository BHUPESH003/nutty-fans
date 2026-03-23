import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation as useConversationHook } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { apiClient } from '@/services/apiClient';

import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { data: session } = useSession();
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    unlockMessage,
  } = useMessages(conversationId);
  const { conversation, isLoading: conversationLoading } = useConversationHook(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    if (conversationId) {
      void apiClient.messaging.markConversationRead(conversationId).catch(console.error);
    }
  }, [conversationId, messages]);

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <p>Conversation not found</p>
        <p className="mt-1 text-xs">
          This conversation may have been deleted or you don&apos;t have access to it.
        </p>
      </div>
    );
  }

  const isCreator = session?.user?.id === conversation?.otherUser?.id ? false : true;

  const handleSendMessage = async (content: string, mediaId?: string, price?: number) => {
    if (!conversationId) return;
    await sendMessage(content, mediaId, price);
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-container-high bg-white/90 p-4 backdrop-blur-sm">
        <Link
          href="/messages"
          className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low md:hidden"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface">arrow_back</span>
          <span className="sr-only">Back</span>
        </Link>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={conversation?.otherUser?.avatarUrl || ''} className="object-cover" />
          <AvatarFallback>{conversation?.otherUser?.displayName?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-headline text-base font-bold text-on-surface">
            {conversation?.otherUser?.displayName ?? 'Unknown User'}
          </h2>
          <p className="text-xs text-secondary">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-surface p-6">
        <div className="no-scrollbar space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === session?.user?.id}
              onUnlock={unlockMessage}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} isCreator={isCreator} />
    </div>
  );
}
