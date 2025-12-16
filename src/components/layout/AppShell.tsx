import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserSummary {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
}

interface AppShellProps {
  children: React.ReactNode;
  user?: UserSummary | null;
}

const navItems = [
  { href: '/' as const, label: 'Home', icon: '🏠' },
  { href: '/profile' as const, label: 'Profile', icon: '👤' },
  { href: '/settings' as const, label: 'Settings', icon: '⚙️' },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  const getInitials = () => {
    const source = user?.displayName || user?.username || '';
    if (!source) return '';
    return source
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[hsl(var(--accent-primary))] text-xs font-semibold text-primary-foreground">
              NF
            </span>
            <span className="text-sm font-semibold tracking-tight">NuttyFans</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              🔔
            </Button>
            <Link href="/profile" aria-label="Your profile">
              <Avatar className="size-8">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback>{getInitials() || 'NF'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 px-4">
        {/* Side nav (desktop) */}
        <aside className="hidden w-52 border-r border-border py-4 pr-4 md:block">
          <nav className="space-y-1 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                    active
                      ? 'border-l-2 border-[hsl(var(--accent-primary))] bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 py-4 md:pl-6">
          <div className="pb-16 md:pb-0">{children}</div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-4 py-2 text-xs">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5',
                  active ? 'text-[hsl(var(--accent-primary))]' : 'text-muted-foreground'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
