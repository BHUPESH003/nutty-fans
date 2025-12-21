'use client';

import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { ConversationList } from '@/components/messaging/ConversationList';
import { NewMessageDialog } from '@/components/messaging/NewMessageDialog';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { conversations, isLoading, isError } = useConversations();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const pathname = usePathname();

  // Check if we are viewing a specific conversation
  // Pathname format: /messages or /messages/[id]
  const isConversationActive = pathname !== '/messages';

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col border-r',
            // Mobile: Hidden if conversation is active
            isConversationActive ? 'hidden md:flex' : 'flex w-full md:w-80',
            // Desktop: Always visible as sidebar
            'md:w-80'
          )}
        >
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="icon" variant="ghost" onClick={() => setNewMessageOpen(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              isError={isError}
            />
          </div>
        </div>

        {/* Main Content */}
        <div
          className={cn(
            'flex-1 flex-col overflow-hidden',
            // Mobile: Hidden if NO conversation is active (show list instead)
            !isConversationActive ? 'hidden md:flex' : 'flex'
          )}
        >
          {children}
        </div>
      </div>
      <NewMessageDialog open={newMessageOpen} onOpenChange={setNewMessageOpen} />
    </>
  );
}
