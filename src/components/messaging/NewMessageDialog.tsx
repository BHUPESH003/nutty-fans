'use client';

import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

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
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (_open: boolean) => void;
}

export function NewMessageDialog({ open, onOpenChange }: NewMessageDialogProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setLoading(true);
      // First, we need to get the user ID from username
      // For MVP, we'll try to get the profile by handle
      const profile = await apiClient.profile.byHandle(username.trim());

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
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              Enter the username (without @) of the person you want to message.
            </p>
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Conversation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
