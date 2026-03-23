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

  onSelect?: (_id: string) => void;
}

export function ConversationList({ conversations, isLoading, isError }: ConversationListProps) {
  const pathname = usePathname();

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

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-0 p-0">
        {conversations.map((conversation) => {
          const isActive = pathname === `/messages/${conversation.id}`;
          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={cn(
                'flex items-center gap-3 px-6 py-4 transition-colors hover:bg-surface-container-low',
                isActive && 'bg-surface-container-low'
              )}
            >
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
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="truncate text-sm text-on-surface-variant">
                    @{conversation?.otherUser?.username ?? 'unknown'}
                  </span>
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
