'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { CreatorCTA } from '@/components/creator/CreatorCTA';
import { CreatorNavButton } from '@/components/creator/CreatorNavButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  { href: '/explore' as const, label: 'Explore', icon: '🔍' },
  { href: '/reels' as const, label: 'Reels', icon: '🎬' },
  { href: '/messages' as const, label: 'Messages', icon: '💬' },
  { href: '/profile' as const, label: 'Profile', icon: '👤' },
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
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-xs font-bold text-white shadow-lg shadow-primary/20">
              NF
            </div>
            <span className="text-lg font-bold tracking-tight">NuttyFans</span>
          </Link>
          <div className="flex items-center gap-3">
            <CreatorNavButton className="hidden sm:flex" />
            <NotificationBell />
            <Link href="/profile" aria-label="Your profile">
              <Avatar className="h-9 w-9 ring-2 ring-white/10 transition-all hover:ring-primary/50">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-muted text-xs">
                  {getInitials() || 'NF'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-start gap-8 px-4 sm:px-6 lg:px-8">
        {/* Side nav (desktop) - Slim & Clean */}
        <aside className="sticky top-20 hidden w-64 shrink-0 md:block">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'text-xl transition-transform group-hover:scale-110',
                      active ? 'scale-110' : ''
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,51,102,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Creator CTA - Smart component based on status */}
          <CreatorCTA variant="sidebar" className="mt-8" />
        </aside>

        {/* Main content */}
        <main className="flex-1 py-6">
          <div className="pb-24 md:pb-0">{children}</div>
        </main>
      </div>

      {/* Floating Bottom Nav (Mobile) - Island Style */}
      <nav className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border border-white/10 bg-background/80 p-2 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-12 w-12 flex-col items-center justify-center rounded-full transition-all',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <span className="text-xl">{item.icon}</span>
              </Link>
            );
          })}

          {/* Center Create Button for Creators */}
          <CreatorNavButton
            variant="icon"
            className="h-14 w-14 bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90"
          />

          {navItems.slice(2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-12 w-12 flex-col items-center justify-center rounded-full transition-all',
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <span className="text-xl">{item.icon}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
