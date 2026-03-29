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
      <div className="flex h-[100vh] overflow-hidden bg-background md:rounded-[28px] md:border md:border-border md:bg-surface-container-lowest md:shadow-card">
        <div
          className={cn(
            'flex shrink-0 flex-col border-border bg-surface-container-lowest md:border-r',
            isConversationActive ? 'hidden md:flex' : 'flex w-full md:w-[340px] lg:w-[380px]'
          )}
        >
          <div className="flex flex-col gap-4 border-b border-border px-4 py-5 md:px-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                  Messages
                </h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Jump back into creator and fan conversations.
                </p>
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full border border-border bg-surface-container-low text-on-surface hover:bg-surface-container"
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
                className="h-11 rounded-full border-border bg-surface-container-low pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
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

        <div
          className={cn(
            'min-w-0 flex-1 flex-col overflow-hidden bg-surface',
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
