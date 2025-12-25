import useSWR from 'swr';

import { apiClient } from '@/services/apiClient';

/**
 * Conversations Hook
 *
 * Note: Polling removed (was 30s). For real-time updates, consider:
 * - Implementing SSE endpoint for conversation list updates
 * - Or using mutation after sending messages (messages already trigger conversation updates)
 *
 * For now, manual refresh via mutate() or automatic refresh on component focus
 */
export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/conversations',
    async () => {
      return apiClient.messaging.listConversations();
    },
    {
      // Polling removed - use revalidateOnFocus for better UX
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

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
