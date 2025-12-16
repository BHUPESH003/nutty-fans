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
  // eslint-disable-next-line no-unused-vars
  onSelect?: (_id: string) => void;
}

// eslint-disable-next-line no-unused-vars
export function ConversationList({
  conversations,
  selectedId: _selectedId,
  onSelect: _onSelect,
}: ConversationListProps) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No conversations yet.</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-2">
        {conversations.map((conversation) => {
          const isActive = pathname === `/messages/${conversation.id}`;
          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50',
                isActive && 'bg-muted'
              )}
            >
              <Avatar>
                <AvatarImage src={conversation.otherUser.avatarUrl || ''} />
                <AvatarFallback>{conversation.otherUser.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{conversation.otherUser.displayName}</span>
                  {conversation.lastMessage?.createdAt && (
                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="truncate text-xs text-muted-foreground">
                    @{conversation.otherUser.username}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
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
