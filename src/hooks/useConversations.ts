import useSWR from 'swr';

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/conversations',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
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
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    }
  );

  return {
    conversation: data,
    isLoading,
    isError: error,
    mutate,
  };
}
