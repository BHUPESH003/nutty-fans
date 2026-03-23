'use client';

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
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white md:rounded-[12px] md:border md:border-surface-container-high md:shadow-card">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col border-surface-container-high bg-white md:border-r',
            // Mobile: Hidden if conversation is active
            isConversationActive ? 'hidden md:flex' : 'flex w-full md:w-[340px]',
            // Desktop: Always visible as sidebar
            'md:w-[340px]'
          )}
        >
          <div className="flex flex-col gap-4 border-b border-surface-container-high p-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-extrabold tracking-tight">Messages</h2>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-surface-container-high"
                onClick={() => setNewMessageOpen(true)}
                aria-label="New message"
              >
                <span className="material-symbols-outlined text-[22px]">edit_square</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-container px-3 py-1.5 text-xs font-bold text-white">
                Broadcast
              </span>
              <span className="rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-primary">
                Requests
              </span>
            </div>
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
