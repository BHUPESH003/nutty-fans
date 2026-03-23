'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';

import { NotificationList } from './NotificationList';

export function NotificationBell() {
  const { unreadCount, isLoading } = useUnreadNotificationCount();
  const pathname = usePathname();
  const isNotificationsPage = pathname === '/notifications';

  const bellClasses = 'relative rounded-full hover:bg-surface-container-low';

  if (isNotificationsPage) {
    return (
      <Link href="/notifications">
        <Button variant="ghost" size="icon" className={bellClasses}>
          <span className="material-symbols-outlined text-[22px] text-on-surface">
            notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" aria-hidden />
          )}
        </Button>
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={bellClasses}>
          <span className="material-symbols-outlined text-[22px] text-on-surface">
            notifications
          </span>
          {!isLoading && unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList showHeader />
      </PopoverContent>
    </Popover>
  );
}
