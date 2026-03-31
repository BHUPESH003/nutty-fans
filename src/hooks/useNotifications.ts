import { useEffect } from 'react';
import useSWR from 'swr';

import { useAuth } from '@/hooks/useAuth';
import { initSocket } from '@/hooks/useMessages';
import { apiClient } from '@/services/apiClient';

export function useNotifications(cursor?: string) {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/notifications' : null,
    async () => {
      return apiClient.notifications.list(cursor);
    },
    {
      refreshInterval: 30000,
    }
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let cleanup = () => {};

    void initSocket().then((socket) => {
      if (cancelled) return;

      const handleNotificationCount = () => {
        void mutate();
      };

      socket.on('notification:count', handleNotificationCount);

      cleanup = () => {
        socket.off('notification:count', handleNotificationCount);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isAuthenticated, mutate]);

  return {
    notifications: data?.items || [],
    nextCursor: data?.nextCursor,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/notifications/unread-count' : null,
    async () => {
      return apiClient.notifications.getUnreadCount();
    },
    {
      refreshInterval: 60000,
    }
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let cleanup = () => {};

    void initSocket().then((socket) => {
      if (cancelled) return;

      const handleNotificationCount = () => {
        void mutate();
      };

      socket.on('notification:count', handleNotificationCount);

      cleanup = () => {
        socket.off('notification:count', handleNotificationCount);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [isAuthenticated, mutate]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.notifications.markAsRead(notificationId);
      await mutate();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      await mutate();
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
