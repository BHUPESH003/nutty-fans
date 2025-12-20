import useSWR from 'swr';

import { apiClient } from '@/services/apiClient';

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/conversations',
    async () => {
      return apiClient.messaging.listConversations();
    },
    {
      refreshInterval: 10000, // Poll every 10s
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
