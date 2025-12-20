import useSWR from 'swr';

import { apiClient } from '@/services/apiClient';

export function useMessages(conversationId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    async () => {
      return apiClient.messaging.listMessages(conversationId);
    },
    {
      refreshInterval: 3000, // Poll every 3s for active chat
    }
  );

  const sendMessage = async (content: string | null, mediaId?: string, price?: number) => {
    try {
      await apiClient.messaging.sendMessage(conversationId, content, mediaId, price);
      await mutate(); // Refresh messages
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const unlockMessage = async (messageId: string) => {
    try {
      await apiClient.messaging.unlockMessage(messageId);
      await mutate(); // Refresh messages to show unlocked content
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    messages: data?.items || [],
    isLoading,
    isError: error,
    mutate,
    sendMessage,
    unlockMessage,
  };
}
