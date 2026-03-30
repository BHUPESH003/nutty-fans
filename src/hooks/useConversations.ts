import { useEffect } from 'react';
import useSWR from 'swr';

import { getSocket } from '@/hooks/useMessages';
import { apiClient } from '@/services/apiClient';

/**
 * Conversations Hook
 *
 * Subscribes to `conversation:updated` Socket.IO events so the sidebar
 * (preview text, unread badge, sort order) refreshes in real time when
 * a new message arrives in any conversation.
 */
export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/conversations',
    async () => {
      return apiClient.messaging.listConversations();
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  useEffect(() => {
    const socket = getSocket();

    const handleConversationUpdated = () => {
      void mutate();
    };

    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [mutate]);

  return {
    conversations: data?.items || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useConversation(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/conversations/${id}` : null,
    async () => {
      return apiClient.messaging.getConversation(id);
    }
  );

  return {
    conversation: data,
    isLoading,
    isError: error,
    mutate,
  };
}
