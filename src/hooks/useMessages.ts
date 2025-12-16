import useSWR from 'swr';

export function useMessages(conversationId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    {
      refreshInterval: 3000, // Poll every 3s for active chat
    }
  );

  const sendMessage = async (content: string | null, mediaId?: string, price?: number) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mediaId, price }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      await mutate(); // Refresh messages
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const unlockMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/unlock`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to unlock message');
      await mutate(); // Refresh messages to show unlocked content
      return await res.json();
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
