'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

import { CreatorCTA } from '@/components/creator/CreatorCTA';
import { CreatorNavButton } from '@/components/creator/CreatorNavButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SearchBar } from '@/components/search/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreatorStatus } from '@/hooks/useCreatorStatus';
import { cn } from '@/lib/utils';

const SIDEBAR_EXPANDED_KEY = 'nuttyfans-sidebar-expanded';

interface UserSummary {
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
}

interface AppShellProps {
  children: React.ReactNode;
  user?: UserSummary | null;
}

const navItems: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/' as Route, label: 'Home', icon: 'home' },
  { href: '/explore' as Route, label: 'Explore', icon: 'explore' },
  { href: '/live' as Route, label: 'Live', icon: 'live_tv' },
  { href: '/reels' as Route, label: 'Reels', icon: 'movie' },
  { href: '/messages' as Route, label: 'Messages', icon: 'chat_bubble' },
];

function accountInitials(user?: UserSummary | null) {
  const source = user?.displayName || user?.username || '';
  if (!source) return '';
  return source
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MobileAccountDropdown({
  pathname,
  user,
  showCreatorDashboard,
}: {
  pathname: string;
  user?: UserSummary | null;
  showCreatorDashboard: boolean;
}) {
  const accountActive =
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/settings') ||
    (showCreatorDashboard && pathname.startsWith('/creator/'));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full outline-none ring-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary',
            accountActive ? 'ring-2 ring-primary/40' : 'ring-2 ring-transparent'
          )}
          aria-label="Account menu"
        >
          <Avatar className="h-9 w-9 ring-2 ring-surface-container-high">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-surface-container-low text-xs text-on-surface">
              {accountInitials(user) || 'NF'}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        className="z-[60] w-56 rounded-xl border-surface-container-high p-1 shadow-lg"
      >
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-headline text-sm font-bold text-on-surface">
            {user?.displayName || user?.username || 'Account'}
          </p>
          {user?.username ? (
            <p className="truncate text-xs text-on-surface-variant">@{user.username}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
          <Link href="/profile" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              person
            </span>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
          <Link href="/settings" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              settings
            </span>
            Settings
          </Link>
        </DropdownMenuItem>
        {showCreatorDashboard ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
              <Link
                href="/creator/dashboard"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  dashboard
                </span>
                Creator dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
              <Link
                href="/creator/posts/new"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  add
                </span>
                Create post
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopAccountMenu({
  user,
  showCreatorDashboard,
}: {
  user?: UserSummary | null;
  showCreatorDashboard: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-3 rounded-full p-3 text-left outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Account menu"
        >
          <Avatar className="h-10 w-10 shrink-0">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-surface-container text-xs text-on-surface">
              {accountInitials(user) || 'NF'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-headline text-sm font-bold text-on-surface">
              {user?.displayName || user?.username || 'Profile'}
            </p>
            {user?.username ? (
              <p className="truncate text-xs text-on-surface-variant">@{user.username}</p>
            ) : null}
          </div>
          <span className="material-symbols-outlined shrink-0 text-[20px] text-on-surface-variant">
            more_horiz
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="z-[60] w-56 rounded-xl p-1 shadow-lg"
      >
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
          <Link href="/profile" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
            <span className="material-symbols-outlined text-[20px]">person</span>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
          <Link href="/settings" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            Settings
          </Link>
        </DropdownMenuItem>
        {showCreatorDashboard ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
              <Link
                href="/creator/dashboard"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Creator dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
              <Link
                href="/creator/posts/new"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create post
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarNavLink({
  href,
  label,
  icon,
  active,
  expanded,
}: {
  href: Route;
  label: string;
  icon: string;
  active: boolean;
  expanded: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'group flex items-center rounded-full py-2.5 text-[15px] transition-colors',
        expanded ? 'gap-4 px-4' : 'mx-auto w-12 justify-center px-0',
        active
          ? 'font-bold text-foreground'
          : 'font-normal text-neutral-600 hover:bg-neutral-100/80'
      )}
    >
      <span className="material-symbols-outlined shrink-0 text-[26px] leading-none">{icon}</span>
      <span
        className={cn(
          'truncate transition-opacity duration-200',
          !expanded && 'sr-only w-0 overflow-hidden opacity-0'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const { onboardingStatus, isLoading: creatorStatusLoading } = useCreatorStatus();
  const showCreatorDashboard = !creatorStatusLoading && onboardingStatus === 'active';
  const isExploreRoute = pathname === '/explore' || pathname.startsWith('/explore/');

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (raw !== null) {
        setSidebarExpanded(raw === 'true');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Mobile top bar — search + quick actions */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label="NuttyFans home">
            <span className="font-headline text-lg font-black text-primary">NuttyFans</span>
          </Link>
          <div className="min-w-0 flex-1">
            {!isExploreRoute ? (
              <Suspense
                fallback={
                  <div className="h-10 w-full animate-pulse rounded-full bg-surface-container-low" />
                }
              >
                <SearchBar
                  variant="discover"
                  className="w-full"
                  placeholder="Search creators, posts..."
                />
              </Suspense>
            ) : (
              <p className="truncate text-center font-headline text-sm font-bold text-on-surface">
                Discover
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CreatorNavButton className="hidden sm:flex" />
            {showCreatorDashboard ? (
              <Link
                href="/creator/dashboard"
                className="hidden items-center justify-center rounded-full border border-surface-container-high bg-surface-container-low px-2 py-1.5 text-[10px] font-bold text-primary sm:flex"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
              </Link>
            ) : null}
            <NotificationBell />
            <Link href="/profile" className="flex" aria-label="Your profile">
              <Avatar className="h-8 w-8 ring-2 ring-surface-container-high transition-all hover:ring-primary/30">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback className="bg-surface-container-low text-[10px] text-on-surface">
                  {accountInitials(user) || 'NF'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full md:min-h-screen">
        {/* Desktop sidebar — X-style: icons + labels, collapsible */}
        <aside
          className={cn(
            'fixed bottom-0 left-0 top-0 z-30 hidden h-screen border-r border-neutral-200/90 bg-white transition-[width] duration-200 ease-out md:flex md:flex-col',
            sidebarExpanded ? 'w-[275px]' : 'w-[72px]'
          )}
        >
          <div className="flex h-full min-h-0 flex-col px-2 pb-3 pt-2">
            <div
              className={cn(
                'mb-1 flex items-center',
                sidebarExpanded ? 'justify-between gap-2 pl-2 pr-1' : 'justify-center'
              )}
            >
              <Link
                href="/"
                className={cn(
                  'flex min-w-0 items-center rounded-full py-2 transition-colors hover:bg-neutral-100/80',
                  sidebarExpanded ? 'gap-2 px-3' : 'h-12 w-12 justify-center px-0'
                )}
                aria-label="NuttyFans home"
              >
                {sidebarExpanded ? (
                  <span className="truncate font-headline text-xl font-black text-primary">
                    NuttyFans
                  </span>
                ) : (
                  <span className="font-headline text-xl font-black text-primary">N</span>
                )}
              </Link>
            </div>

            {!isExploreRoute ? (
              <div className={cn('mb-3 min-w-0', sidebarExpanded ? 'px-2' : 'flex justify-center')}>
                {sidebarExpanded ? (
                  <Suspense
                    fallback={
                      <div className="h-11 w-full animate-pulse rounded-full bg-surface-container-low" />
                    }
                  >
                    <SearchBar
                      variant="discover"
                      className="w-full"
                      placeholder="Search creators, posts..."
                    />
                  </Suspense>
                ) : (
                  <Link
                    href="/explore"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100/80"
                    aria-label="Search"
                    title="Search"
                  >
                    <span className="material-symbols-outlined text-[26px]">search</span>
                  </Link>
                )}
              </div>
            ) : null}

            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={active}
                    expanded={sidebarExpanded}
                  />
                );
              })}

              <SidebarNavLink
                href={'/notifications' as Route}
                label="Notifications"
                icon="notifications"
                active={pathname === '/notifications' || pathname.startsWith('/notifications/')}
                expanded={sidebarExpanded}
              />

              <div
                className={cn(
                  'mt-2 flex flex-col gap-2',
                  sidebarExpanded ? 'px-2' : 'items-center'
                )}
              >
                <CreatorNavButton
                  variant={sidebarExpanded ? 'default' : 'icon'}
                  className={cn(!sidebarExpanded && 'w-12')}
                />
                {showCreatorDashboard ? (
                  <Link
                    href="/creator/dashboard"
                    title="Creator dashboard"
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-full border border-surface-container-high bg-surface-container-low text-xs font-bold text-primary transition-colors hover:bg-primary/5',
                      sidebarExpanded ? 'px-4 py-2.5' : 'h-12 w-12 border-0 p-0'
                    )}
                  >
                    <span className="material-symbols-outlined shrink-0 text-[22px]">
                      dashboard
                    </span>
                    {sidebarExpanded ? (
                      <span>Dashboard</span>
                    ) : (
                      <span className="sr-only">Dashboard</span>
                    )}
                  </Link>
                ) : null}
              </div>
            </nav>

            <div className={cn('mt-3', sidebarExpanded ? 'px-1' : 'flex justify-center')}>
              {sidebarExpanded ? (
                <CreatorCTA variant="sidebar" className="w-full" />
              ) : (
                <Link
                  href={showCreatorDashboard ? '/creator/dashboard' : '/creator/start'}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5"
                  title={showCreatorDashboard ? 'Creator' : 'Become a creator'}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {showCreatorDashboard ? 'palette' : 'auto_awesome'}
                  </span>
                </Link>
              )}
            </div>

            <div className="mt-auto space-y-1 border-t border-neutral-100 pt-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'flex w-full items-center rounded-full py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-100/80',
                  sidebarExpanded ? 'gap-3 px-4' : 'justify-center'
                )}
                aria-expanded={sidebarExpanded}
                aria-label={sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {sidebarExpanded ? 'left_panel_close' : 'left_panel_open'}
                </span>
                {sidebarExpanded ? <span>Collapse</span> : <span className="sr-only">Expand</span>}
              </button>

              {sidebarExpanded ? (
                <DesktopAccountMenu user={user} showCreatorDashboard={showCreatorDashboard} />
              ) : (
                <div className="flex justify-center pb-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full p-1 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Account menu"
                      >
                        <Avatar className="h-10 w-10">
                          {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                          <AvatarFallback className="bg-surface-container text-xs text-on-surface">
                            {accountInitials(user) || 'NF'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="top"
                      align="center"
                      className="z-[60] w-56 rounded-xl p-1 shadow-lg"
                    >
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
                        <Link
                          href="/profile"
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
                        >
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
                        <Link
                          href="/settings"
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm"
                        >
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {showCreatorDashboard ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
                            <Link
                              href="/creator/dashboard"
                              className="flex w-full px-2 py-1.5 text-sm"
                            >
                              Creator dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0">
                            <Link
                              href="/creator/posts/new"
                              className="flex w-full px-2 py-1.5 text-sm"
                            >
                              Create post
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main feed / page — margin clears fixed sidebar */}
        <main
          className={cn(
            'w-full min-w-0 flex-1 transition-[margin] duration-200 ease-out',
            'pb-24 md:pb-6',
            sidebarExpanded ? 'md:ml-[275px]' : 'md:ml-[72px]'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/90 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
                  active ? 'text-primary' : 'text-neutral-400'
                )}
                aria-label={item.label}
              >
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              </Link>
            );
          })}
          <MobileAccountDropdown
            pathname={pathname}
            user={user}
            showCreatorDashboard={showCreatorDashboard}
          />
        </div>
      </nav>
    </div>
  );
}
