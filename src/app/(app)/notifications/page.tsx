'use client';

import { NotificationList } from '@/components/notifications/NotificationList';
import { Button } from '@/components/ui/button';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

export default function NotificationsPage() {
  const { markAllAsRead, unreadCount } = useUnreadNotificationCount();

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <NotificationList />
      </div>
    </div>
  );
}
