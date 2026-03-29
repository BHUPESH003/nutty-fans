import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation as useConversationHook } from '@/hooks/useConversations';
import { getSocket, useMessages } from '@/hooks/useMessages';
import { apiClient } from '@/services/apiClient';
import type { Message } from '@/types/messaging';

import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isCreator, setIsCreator] = useState(false);

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    retryMessage,
    unlockMessage,
    reactToMessage,
  } = useMessages(conversationId);
  const { conversation, isLoading: conversationLoading } = useConversationHook(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherUserId = conversation?.otherUser?.id;

  // Presence + typing indicators
  useEffect(() => {
    if (!conversation || !otherUserId) return;

    let isMounted = true;

    const socket = getSocket();

    void apiClient.user
      .getPresence(otherUserId)
      .then(({ online, lastSeen }) => {
        if (!isMounted) return;
        setIsOnline(online);
        setLastSeen(lastSeen);
      })
      .catch(() => {
        // Best effort: WS will still update online/offline.
      });

    const handlePresenceOnline = ({ userId }: { userId: string }) => {
      if (!isMounted) return;
      if (userId === otherUserId) {
        setIsOnline(true);
        setLastSeen(null);
      }
    };

    const handlePresenceOffline = ({
      userId,
      lastSeen: ls,
    }: {
      userId: string;
      lastSeen: string;
    }) => {
      if (!isMounted) return;
      if (userId === otherUserId) {
        setIsOnline(false);
        setLastSeen(ls);
      }
    };

    const handleTypingStart = ({
      userId,
    }: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (!isMounted) return;
      if (userId === otherUserId) {
        setTypingUsers(new Set([userId]));
      }
    };

    const handleTypingStop = ({ userId }: { conversationId: string; userId: string }) => {
      if (!isMounted) return;
      if (userId === otherUserId) {
        setTypingUsers(new Set());
      }
    };

    socket.on('presence:online', handlePresenceOnline);
    socket.on('presence:offline', handlePresenceOffline);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      isMounted = false;
      socket.off('presence:online', handlePresenceOnline);
      socket.off('presence:offline', handlePresenceOffline);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      setTypingUsers(new Set());
    };
  }, [conversationId, conversation, otherUserId]);

  // Determine whether the current user is a creator (used for PPV + tipping UI).
  useEffect(() => {
    if (!session?.user?.id) {
      setIsCreator(false);
      return;
    }

    let active = true;
    void apiClient.creator
      .getStatus()
      .then((status) => {
        if (!active) return;
        setIsCreator(Boolean(status));
      })
      .catch(() => {
        if (!active) return;
        setIsCreator(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const handleSendMessage = async (
    content: string,
    mediaIds?: string[],
    price?: number,
    options?: { messageTypeOverride?: Message['messageType']; metadata?: Record<string, unknown> }
  ) => {
    if (!conversationId) return;
    await sendMessage(content, mediaIds, price, {
      messageTypeOverride: options?.messageTypeOverride,
      metadata: options?.metadata,
    });
  };

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center gap-3 border-b border-border bg-surface-container-lowest px-4 py-4 md:px-5">
        <Link
          href="/messages"
          className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-container-low hover:bg-surface-container md:hidden"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface">arrow_back</span>
          <span className="sr-only">Back</span>
        </Link>
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={conversation?.otherUser?.avatarUrl || ''} className="object-cover" />
          <AvatarFallback>{conversation?.otherUser?.displayName?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate font-headline text-base font-bold text-on-surface">
            {conversation?.otherUser?.displayName ?? 'Unknown User'}
          </h2>
          <p className="truncate text-xs font-medium text-on-surface-variant">
            {isOnline ? (
              <span className="text-emerald-600">Online now</span>
            ) : lastSeen ? (
              <span>{`Last seen ${formatDistanceToNow(new Date(lastSeen))} ago`}</span>
            ) : (
              <span>Offline</span>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-9 rounded-full px-4 text-sm">
            <span className="material-symbols-outlined mr-1 text-[16px]">local_atm</span>
            Tip
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-border bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 bg-[radial-gradient(circle_at_top,_hsl(var(--surface-container-low))_0%,_transparent_28%),linear-gradient(180deg,hsl(var(--surface))_0%,hsl(var(--surface-container-lowest))_100%)] p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="mx-auto my-2 w-fit rounded-full bg-surface-container px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Today
          </div>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === session?.user?.id}
              onUnlock={unlockMessage}
              onRetry={retryMessage}
              onReact={reactToMessage}
              avatarUrl={conversation?.otherUser?.avatarUrl ?? null}
              avatarName={conversation?.otherUser?.displayName ?? 'U'}
            />
          ))}
          {typingUsers.size > 0 && (
            <div className="flex items-center gap-2 px-6 py-2">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant" />
              </div>
              <span className="text-xs italic text-on-surface-variant">typing…</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        isCreator={isCreator}
        conversationId={conversationId}
        recipientId={conversation?.otherUser?.id}
        className="border-t border-border bg-surface-container-lowest md:order-3"
      />
    </div>
  );
}
