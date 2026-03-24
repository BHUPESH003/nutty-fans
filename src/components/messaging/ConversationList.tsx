import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/messaging';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  isLoading?: boolean;
  isError?: boolean;
  searchQuery?: string;
  activeTab?: 'all' | 'unread' | 'requests';

  onSelect?: (_id: string) => void;
}

function formatCompactTime(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneHour = 1000 * 60 * 60;
  const oneDay = oneHour * 24;
  if (diffMs < oneHour) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}m ago`;
  if (diffMs < oneDay) return `${Math.floor(diffMs / oneHour)}h ago`;
  if (diffMs < oneDay * 2) return 'Yesterday';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function ConversationList({
  conversations,
  isLoading,
  isError,
  searchQuery = '',
  activeTab = 'all',
}: ConversationListProps) {
  const pathname = usePathname();
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[28px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-on-surface-variant">
        <span className="material-symbols-outlined mb-2 text-[28px] text-error">error</span>
        <p className="text-sm">Failed to load conversations</p>
        <p className="mt-1 text-xs">Please try refreshing the page</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <p className="text-sm">No conversations yet.</p>
        <p className="mt-1 text-xs">Click the + button to start a new conversation</p>
      </div>
    );
  }

  const filtered = conversations.filter((conversation) => {
    if (activeTab === 'unread' && conversation.unreadCount === 0) return false;
    const name = conversation?.otherUser?.displayName?.toLowerCase() ?? '';
    const handle = conversation?.otherUser?.username?.toLowerCase() ?? '';
    const preview = conversation?.lastMessage?.content?.toLowerCase() ?? '';
    if (!normalizedQuery) return true;
    return (
      name.includes(normalizedQuery) ||
      handle.includes(normalizedQuery) ||
      preview.includes(normalizedQuery)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-on-surface-variant">
        <span className="material-symbols-outlined mb-2 text-[28px]">search_off</span>
        <p className="text-sm">No conversations found</p>
        <p className="mt-1 text-xs">Try another search or switch tabs.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-0 p-0">
        {filtered.map((conversation) => {
          const isActive = pathname === `/messages/${conversation.id}`;
          const preview =
            conversation.lastMessage?.content && conversation.lastMessage.content.length > 0
              ? conversation.lastMessage.content
              : 'Start chatting...';
          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={cn(
                'relative flex items-center gap-3 border-b border-surface-container-low px-4 py-4 transition-colors hover:bg-surface-container-low',
                isActive && 'bg-primary/5'
              )}
            >
              {isActive ? <span className="absolute inset-y-0 left-0 w-1 bg-primary" /> : null}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage
                  src={conversation?.otherUser?.avatarUrl || ''}
                  className="object-cover"
                />
                <AvatarFallback>{conversation?.otherUser?.displayName?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold text-on-surface">
                    {conversation?.otherUser?.displayName ?? 'Unknown User'}
                  </span>
                  {conversation.lastMessage?.createdAt && (
                    <span className="ml-2 whitespace-nowrap text-xs text-on-surface-variant">
                      {formatCompactTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="truncate text-sm text-on-surface-variant">{preview}</span>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
}
