import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversation as useConversationHook } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { Message } from '@/types/messaging';

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
      void fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' });
    }
  }, [conversationId, messages]);

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return <div className="p-4">Conversation not found</div>;
  }

  const isCreator = session?.user?.id === conversation.otherUser.id ? false : true;

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
      <div className="flex items-center gap-3 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Avatar>
          <AvatarImage src={conversation.otherUser.avatarUrl || ''} />
          <AvatarFallback>{conversation.otherUser.displayName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{conversation.otherUser.displayName}</h2>
          <p className="text-xs text-muted-foreground">@{conversation.otherUser.username}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg: Message) => (
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
