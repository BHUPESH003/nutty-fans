import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useConversation as useConversationHook } from '@/hooks/useConversations';
import { getSocket, useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import type { Message } from '@/types/messaging';

import { MediaViewerModal } from '../media/MediaViewerModal';

import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isCreator, setIsCreator] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [galleryViewerOpen, setGalleryViewerOpen] = useState(false);
  const [galleryViewerIndex, setGalleryViewerIndex] = useState(0);

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const otherUserId = conversation?.otherUser?.id;

  useEffect(() => {
    if (!conversationId || !session?.user?.id) return;

    let cancelled = false;
    void apiClient.messaging
      .getConversationPreferences(conversationId)
      .then((prefs) => {
        if (cancelled) return;
        setIsMuted(Boolean(prefs.muted));
        setIsFavorite(Boolean(prefs.favorited));
        setIsRestricted(Boolean(prefs.restricted));
        setIsBlockedByMe(Boolean(prefs.blocked && prefs.blockedBy === session.user.id));
      })
      .catch(() => {
        // Best effort; keep defaults.
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, session?.user?.id]);

  useEffect(() => {
    if (!isSearchOpen) return;
    searchInputRef.current?.focus();
  }, [isSearchOpen]);

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

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayedMessages = normalizedSearch
    ? messages.filter((m) => (m.content || '').toLowerCase().includes(normalizedSearch))
    : messages;

  const mediaGallery = messages.flatMap((m) =>
    (m.media ?? [])
      .filter((media) => media.mediaType === 'image' || media.mediaType === 'video')
      .map((media) => ({
        id: `${m.id}:${media.id}`,
        src: media.processedUrl || media.originalUrl,
        thumbnail: media.thumbnailUrl || media.processedUrl || media.originalUrl,
        mediaType: media.mediaType,
      }))
      .filter((item) => Boolean(item.src))
  );

  const toggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      await apiClient.messaging.updateConversationPreferences(conversationId, { muted: next });
    } catch {
      setIsMuted(!next);
      toast({
        title: 'Failed to update mute',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: next ? 'Notifications muted' : 'Notifications unmuted',
      description: next
        ? 'You will not receive alerts for this chat.'
        : 'Alerts are enabled again for this chat.',
    });
  };

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      await apiClient.messaging.updateConversationPreferences(conversationId, { favorited: next });
    } catch {
      setIsFavorite(!next);
      toast({
        title: 'Failed to update favorite',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: next ? 'Added to favorites' : 'Removed from favorites',
      description: next ? 'This chat is now favorited.' : 'This chat is no longer favorited.',
    });
  };

  const toggleRestrict = async () => {
    const next = !isRestricted;
    setIsRestricted(next);
    try {
      await apiClient.messaging.updateConversationPreferences(conversationId, { restricted: next });
    } catch {
      setIsRestricted(!next);
      toast({
        title: 'Failed to update restrict',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: next ? 'User restricted' : 'Restriction removed',
      description: next
        ? 'This chat is now restricted for your account.'
        : 'This chat is no longer restricted.',
    });
  };

  const toggleBlock = async () => {
    const next = !isBlockedByMe;
    setIsBlockedByMe(next);
    try {
      await apiClient.messaging.setConversationBlocked(
        conversationId,
        next,
        'blocked_from_chat_menu'
      );
    } catch {
      setIsBlockedByMe(!next);
      toast({
        title: 'Failed to update block',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: next ? 'User blocked' : 'User unblocked',
      description: next
        ? 'This user is blocked from chatting with you.'
        : 'Block has been removed.',
    });
  };

  const hideChat = async () => {
    try {
      await apiClient.messaging.updateConversationPreferences(conversationId, { hidden: true });
      toast({ title: 'Chat hidden', description: 'Conversation moved out of your inbox.' });
      router.push('/messages');
    } catch {
      toast({
        title: 'Failed to hide chat',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const reportUser = async () => {
    try {
      await apiClient.messaging.reportConversation(
        conversationId,
        'chat_abuse',
        `Reported via chat menu by ${session?.user?.id ?? 'unknown'}`
      );
      toast({
        title: 'Report submitted',
        description: 'Thanks. Our safety team will review it.',
      });
    } catch {
      toast({
        title: 'Failed to submit report',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openProfile = () => {
    if (!conversation?.otherUser?.username) return;
    window.location.href = `/c/${conversation.otherUser.username}`;
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface-container-lowest px-4 py-4 md:px-5">
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
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={openProfile}
            className="block truncate text-left font-headline text-base font-bold text-on-surface transition hover:text-primary"
          >
            {conversation?.otherUser?.displayName ?? 'Unknown User'}
          </button>
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-border bg-surface-container-low"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-label="Find in chat"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full border border-border bg-surface-container-low"
            onClick={() => setIsGalleryOpen(true)}
            aria-label="Chat gallery"
          >
            <span className="material-symbols-outlined text-[20px]">photo_library</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'hidden h-9 w-9 rounded-full border border-border bg-surface-container-low sm:inline-flex',
              isFavorite && 'text-amber-500'
            )}
            onClick={() => void toggleFavorite()}
            aria-label="Favorite chat"
          >
            <span className="material-symbols-outlined text-[20px]">star</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'hidden h-9 w-9 rounded-full border border-border bg-surface-container-low sm:inline-flex',
              isMuted && 'text-primary'
            )}
            onClick={() => void toggleMute()}
            aria-label="Mute notifications"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isMuted ? 'notifications_off' : 'notifications'}
            </span>
          </Button>
          <Button size="sm" className="hidden h-9 rounded-full px-4 text-sm md:inline-flex">
            <span className="material-symbols-outlined mr-1 text-[16px]">local_atm</span>
            Tip
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full border border-border bg-surface-container-low"
                aria-label="More options"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={conversation?.otherUser?.avatarUrl || ''}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {conversation?.otherUser?.displayName?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={openProfile}
                  className="truncate text-left text-sm font-semibold hover:text-primary"
                >
                  @{conversation?.otherUser?.username ?? 'profile'}
                </button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={openProfile}>
                <span className="material-symbols-outlined mr-2 text-[18px]">person</span>
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = `${window.location.origin}/c/${conversation?.otherUser?.username ?? ''}`;
                  void navigator.clipboard?.writeText(url);
                  toast({ title: 'Profile link copied' });
                }}
              >
                <span className="material-symbols-outlined mr-2 text-[18px]">link</span>
                Copy link to profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setIsGalleryOpen(true)}>
                <span className="material-symbols-outlined mr-2 text-[18px]">photo_library</span>
                Chat gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSearchOpen(true)}>
                <span className="material-symbols-outlined mr-2 text-[18px]">search</span>
                Find in chat
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={isFavorite}
                onCheckedChange={() => void toggleFavorite()}
              >
                <span className="material-symbols-outlined mr-2 text-[18px]">star</span>
                Favorite
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={isMuted} onCheckedChange={() => void toggleMute()}>
                <span className="material-symbols-outlined mr-2 text-[18px]">
                  {isMuted ? 'notifications_off' : 'notifications'}
                </span>
                Mute notifications
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void hideChat()}>
                <span className="material-symbols-outlined mr-2 text-[18px]">visibility_off</span>
                Hide chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void toggleRestrict()}>
                <span className="material-symbols-outlined mr-2 text-[18px]">gpp_maybe</span>
                {isRestricted ? 'Unrestrict' : 'Restrict'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void toggleBlock()}>
                <span className="material-symbols-outlined mr-2 text-[18px]">block</span>
                {isBlockedByMe ? 'Unblock' : 'Block'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void reportUser()}>
                <span className="material-symbols-outlined mr-2 text-[18px]">flag</span>
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isSearchOpen && (
        <div className="sticky top-[72px] z-20 border-b border-border bg-surface-container-low px-4 py-2 md:px-5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in this chat"
                className="h-10 w-full rounded-full border border-border bg-surface-container-lowest pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-full px-3"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
            >
              Close
            </Button>
          </div>
          {normalizedSearch && (
            <p className="mt-1 text-xs text-on-surface-variant">
              {displayedMessages.length} result{displayedMessages.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1 bg-[radial-gradient(circle_at_top,_hsl(var(--surface-container-low))_0%,_transparent_28%),linear-gradient(180deg,hsl(var(--surface))_0%,hsl(var(--surface-container-lowest))_100%)] p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="mx-auto my-2 w-fit rounded-full bg-surface-container px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Today
          </div>
          {displayedMessages.map((msg) => (
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
          {normalizedSearch && displayedMessages.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              No matching messages found.
            </div>
          )}
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

      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsGalleryOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-border bg-surface-container-lowest shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-headline text-base font-bold text-on-surface">Chat gallery</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsGalleryOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </Button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {mediaGallery.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  No photos or videos in this conversation yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {mediaGallery.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGalleryViewerIndex(mediaGallery.findIndex((m) => m.id === item.id));
                        setGalleryViewerOpen(true);
                      }}
                      className="group relative block h-36 overflow-hidden rounded-xl border border-border bg-black"
                    >
                      {item.mediaType === 'video' ? (
                        <>
                          <video
                            src={item.src || undefined}
                            className="h-full w-full object-cover"
                            muted
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                            <span className="material-symbols-outlined text-white">
                              play_circle
                            </span>
                          </span>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail || item.src || ''}
                          alt="Gallery media"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MediaViewerModal
        open={galleryViewerOpen}
        items={mediaGallery.map((item) => ({
          type: item.mediaType === 'video' ? 'video' : 'image',
          src: item.src || '',
          poster: item.thumbnail,
          alt: 'Chat gallery media',
        }))}
        initialIndex={galleryViewerIndex}
        onClose={() => setGalleryViewerOpen(false)}
      />
    </div>
  );
}
