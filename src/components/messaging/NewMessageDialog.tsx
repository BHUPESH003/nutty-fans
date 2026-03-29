'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';

interface NewMessageDialogProps {
  open: boolean;

  onOpenChange: (_open: boolean) => void;
}

interface CreatorSearchResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified?: boolean;
  subscriberCount?: number;
}

export function NewMessageDialog({ open, onOpenChange }: NewMessageDialogProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CreatorSearchResult[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setUsername('');
      setResults([]);
      return;
    }

    const query = username.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timeoutId = window.setTimeout(() => {
      void apiClient.search
        .searchCreators(query, undefined, 8)
        .then((response) => {
          if (cancelled) return;
          setResults((response.creators || []) as CreatorSearchResult[]);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error('Failed to search creators:', error);
          setResults([]);
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      setSearching(false);
    };
  }, [open, username]);

  const startConversation = async (handle: string) => {
    if (!handle.trim()) return;

    try {
      setLoading(true);
      const profile = await apiClient.profile.byHandle(handle.trim());

      if (!profile?.id) {
        toast({
          title: 'User not found',
          description: 'Could not find a user with that username.',
        });
        return;
      }

      // Create conversation
      const conversation = await apiClient.messaging.createConversation(profile.id);

      if (!conversation?.id) {
        throw new Error('Invalid conversation response');
      }

      // Navigate to the conversation
      router.push(`/messages/${conversation.id}`);
      onOpenChange(false);
      setUsername('');
      setResults([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (results[0]?.handle) {
      await startConversation(results[0].handle);
      return;
    }

    if (!username.trim()) return;
    await startConversation(username.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Start a conversation by entering a username or handle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Creator</Label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                search
              </span>
              <Input
                id="username"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Search by creator handle or display name to start a conversation.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-surface-container-high bg-surface-container-lowest">
            {searching ? (
              <div className="flex items-center justify-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[22px]">
                  progress_activity
                </span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-surface-container-high">
                {results.map((creator) => (
                  <button
                    key={creator.id}
                    type="button"
                    onClick={() => void startConversation(creator.handle)}
                    disabled={loading}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-container-low"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
                      <AvatarFallback>{creator.displayName[0] ?? 'C'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {creator.displayName}
                        </p>
                        {creator.isVerified ? (
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            verified
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-on-surface-variant">@{creator.handle}</p>
                    </div>
                    {creator.subscriberCount ? (
                      <span className="text-xs text-on-surface-variant">
                        {creator.subscriberCount.toLocaleString()} fans
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : username.trim().length >= 2 ? (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
                No creators matched your search.
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
                Start typing to search creators.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setUsername('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!username.trim() || loading}>
              {loading && (
                <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">
                  progress_activity
                </span>
              )}
              Start Conversation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
