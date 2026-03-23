'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Notification } from '@/types/notifications';

interface NotificationListProps {
  showHeader?: boolean;
  limit?: number;
}

export function NotificationList({ showHeader = false, limit = 10 }: NotificationListProps) {
  const { notifications, isLoading } = useNotifications();
  const { markAsRead, markAllAsRead } = useUnreadNotificationCount();
  const router = useRouter();

  const displayedNotifications = limit ? notifications.slice(0, limit) : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.actionUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(notification.actionUrl! as any);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="material-symbols-outlined animate-spin text-[28px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {showHeader && (
        <>
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.some((n) => !n.isRead) && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <Separator />
        </>
      )}

      <ScrollArea className={showHeader ? 'h-[400px]' : ''}>
        {displayedNotifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="flex flex-col gap-4 p-2">
            {displayedNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full rounded-[12px] p-4 text-left transition-colors hover:bg-surface-container-low',
                  !notification.isRead && 'bg-primary/5'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          !notification.isRead && 'font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.isRead && (
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          done_all
                        </span>
                      )}
                    </div>
                    {notification.body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {showHeader && displayedNotifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link href="/notifications">
              <Button variant="ghost" className="w-full" size="sm">
                View all notifications
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
