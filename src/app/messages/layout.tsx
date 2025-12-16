'use client';

import { Plus } from 'lucide-react';
import React from 'react';

import { AppShellContainer } from '@/components/containers/layout/AppShellContainer';
import { ConversationList } from '@/components/messaging/ConversationList';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { conversations } = useConversations();

  return (
    <AppShellContainer>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border bg-background shadow-sm">
        {/* Sidebar */}
        <div className="flex w-80 flex-col border-r">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList conversations={conversations} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </AppShellContainer>
  );
}
