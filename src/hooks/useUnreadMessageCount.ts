'use client';

import { useEffect } from 'react';
import useSWR from 'swr';

import { useAuth } from '@/hooks/useAuth';
import { getSocket } from '@/hooks/useMessages';
import { apiClient } from '@/services/apiClient';

export function useUnreadMessageCount() {
  const { isAuthenticated } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/conversations/unread-count' : null,
    () => apiClient.messaging.getUnreadMessageCount(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    const handleConversationUpdated = () => {
      void mutate();
    };

    const handleMessageRead = () => {
      void mutate();
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('message:read', handleMessageRead);
    };
  }, [isAuthenticated, mutate]);

  return {
    unreadCount: data?.count ?? 0,
    isLoading,
    isError: error,
    mutate,
  };
}
