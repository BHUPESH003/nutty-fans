'use client';

import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { ConversationList } from '@/components/messaging/ConversationList';
import { NewMessageDialog } from '@/components/messaging/NewMessageDialog';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { conversations, isLoading, isError } = useConversations();
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r">
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
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      <NewMessageDialog open={newMessageOpen} onOpenChange={setNewMessageOpen} />
    </>
  );
}
