'use client';

import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { ConversationList } from '@/components/messaging/ConversationList';
import { NewMessageDialog } from '@/components/messaging/NewMessageDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { conversations, isLoading, isError } = useConversations();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'requests'>('all');
  const [query, setQuery] = useState('');
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
          <div className="flex flex-col gap-4 border-b border-surface-container-high p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-extrabold tracking-tight">Messages</h2>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full"
                onClick={() => setNewMessageOpen(true)}
                aria-label="New message"
              >
                <span className="material-symbols-outlined text-[22px]">edit_square</span>
              </Button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                search
              </span>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats..."
                className="h-11 pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'requests', label: 'Requests' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'all' | 'unread' | 'requests')}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'border border-surface-container-high bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              isError={isError}
              activeTab={activeTab}
              searchQuery={query}
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
