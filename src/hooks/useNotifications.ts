import useSWR from 'swr';

import { apiClient } from '@/services/apiClient';

export function useNotifications(cursor?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/notifications',
    async () => {
      return apiClient.notifications.list(cursor);
    },
    {
      refreshInterval: 30000, // Poll every 30s
    }
  );

  return {
    notifications: data?.items || [],
    nextCursor: data?.nextCursor,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useUnreadNotificationCount() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/notifications/unread-count',
    async () => {
      return apiClient.notifications.getUnreadCount();
    },
    {
      refreshInterval: 10000, // Poll every 10s for badge count
    }
  );

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.notifications.markAsRead(notificationId);
      await mutate(); // Refresh count
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      await mutate(); // Refresh count
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return {
    unreadCount: data?.count || 0,
    isLoading,
    isError: error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}
