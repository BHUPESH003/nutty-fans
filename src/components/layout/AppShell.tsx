'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

import { CreatorCTA } from '@/components/creator/CreatorCTA';
import { CreatorNavButton } from '@/components/creator/CreatorNavButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTheme } from '@/components/providers/ThemeProvider';
import { SearchBar } from '@/components/search/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  { href: '/explore' as Route, label: 'Explore', icon: 'search' },
  { href: '/notifications' as Route, label: 'Notifications', icon: 'notifications' },
  { href: '/messages' as Route, label: 'Messages', icon: 'chat_bubble' },
  { href: '/subscriptions' as Route, label: 'Subscriptions', icon: 'subscriptions' },
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
  const { theme, setTheme } = useTheme();
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
              {accountInitials(user) || 'NuttyFans'}
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
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
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
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-3 text-left outline-none transition-colors hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Account menu"
        >
          <Avatar className="h-10 w-10 shrink-0">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-surface-container text-xs text-on-surface">
              {accountInitials(user) || 'NuttyFans'}
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
        className="z-[60] w-56 rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-lg"
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
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
        'group flex items-center rounded-2xl py-3 text-[15px] transition-colors',
        expanded ? 'gap-4 px-4' : 'mx-auto w-12 justify-center px-0',
        active
          ? 'bg-primary/10 font-bold text-primary'
          : 'font-normal text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
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

function SidebarMoreMenu({
  expanded,
  showCreatorDashboard,
}: {
  expanded: boolean;
  showCreatorDashboard: boolean;
}) {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center rounded-2xl py-3 text-[15px] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface',
            expanded ? 'gap-4 px-4' : 'mx-auto w-12 justify-center px-0'
          )}
        >
          <span className="material-symbols-outlined shrink-0 text-[26px] leading-none">
            more_horiz
          </span>
          <span
            className={cn(
              'truncate transition-opacity duration-200',
              !expanded && 'sr-only w-0 overflow-hidden opacity-0'
            )}
          >
            More
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        className="z-[60] w-60 rounded-2xl border-border bg-popover p-1 text-popover-foreground shadow-xl"
      >
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0">
          <Link href="/profile" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0">
          <Link href="/wallet" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Wallet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0">
          <Link href="/settings" className="flex w-full items-center gap-2 px-3 py-2.5 text-sm">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl p-0">
          <Link
            href={showCreatorDashboard ? '/creator/dashboard' : '/creator/start'}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showCreatorDashboard ? 'dashboard' : 'auto_awesome'}
            </span>
            {showCreatorDashboard ? 'Creator dashboard' : 'Become a creator'}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const { onboardingStatus, isLoading: creatorStatusLoading } = useCreatorStatus();
  const showCreatorDashboard = !creatorStatusLoading && onboardingStatus === 'active';
  const isExploreRoute = pathname === '/explore' || pathname.startsWith('/explore/');
  const isReelsRoute = pathname === '/reels' || pathname.startsWith('/reels/');
  const isMessageDetailRoute = /^\/messages\/[^/]+$/.test(pathname);
  const hideMobileChrome = isMessageDetailRoute;

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Mobile top bar — icon-triggered search + quick actions */}
      {!hideMobileChrome ? (
        <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-3 sm:px-4">
            {!mobileSearchOpen ? (
              <Link
                href="/"
                className="flex shrink-0 items-center gap-1.5"
                aria-label="NuttyFans home"
              >
                <Image
                  src="/Group.svg"
                  alt=""
                  width={36}
                  height={22}
                  className="h-6 w-auto"
                  unoptimized
                />
                <span className="font-headline text-lg font-black text-primary">NuttyFans</span>
              </Link>
            ) : null}
            <div className="min-w-0 flex-1">
              {mobileSearchOpen && !isExploreRoute ? (
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
                isExploreRoute && (
                  <p className="truncate text-center font-headline text-sm font-bold text-on-surface">
                    Discover
                  </p>
                )
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isExploreRoute ? (
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {mobileSearchOpen ? 'close' : 'search'}
                  </span>
                </button>
              ) : null}
              <CreatorNavButton className="hidden sm:flex" />
              {!isExploreRoute ? (
                <Link
                  href="/messages"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  aria-label="Messages"
                >
                  <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
                </Link>
              ) : null}
              {showCreatorDashboard ? (
                <Link
                  href="/creator/dashboard"
                  className="hidden items-center justify-center rounded-full border border-surface-container-high bg-surface-container-low px-2 py-1.5 text-[10px] font-bold text-primary sm:flex"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                </Link>
              ) : null}
              <NotificationBell />
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={cn(
          'relative flex w-full md:min-h-screen',
          hideMobileChrome ? 'min-h-screen' : 'min-h-[calc(100vh-3.5rem)]'
        )}
      >
        {/* Desktop sidebar — X-style: icons + labels, collapsible */}
        <aside
          className={cn(
            'fixed bottom-0 left-0 top-0 z-30 hidden h-screen border-r border-outline-variant bg-surface-container-lowest transition-[width] duration-200 ease-out md:flex md:flex-col',
            sidebarExpanded ? 'w-[290px]' : 'w-[72px]'
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
                  'flex min-w-0 items-center rounded-full py-2 transition-colors hover:bg-surface-container',
                  sidebarExpanded ? 'gap-2 px-3' : 'h-12 w-12 justify-center px-0'
                )}
                aria-label="NuttyFans home"
              >
                {sidebarExpanded ? (
                  <>
                    <Image
                      src="/Group.svg"
                      alt=""
                      width={40}
                      height={24}
                      className="h-6 w-auto shrink-0"
                      unoptimized
                    />
                    <span className="truncate font-headline text-xl font-black text-primary">
                      NuttyFans
                    </span>
                  </>
                ) : (
                  <Image
                    src="/Group.svg"
                    alt="NuttyFans"
                    width={36}
                    height={22}
                    className="h-7 w-auto shrink-0"
                    unoptimized
                  />
                )}
              </Link>
            </div>

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
              <SidebarMoreMenu
                expanded={sidebarExpanded}
                showCreatorDashboard={showCreatorDashboard}
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
                      'flex items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-container-low text-xs font-bold text-primary transition-colors hover:bg-surface-container',
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
                  className="flex h-12 w-12 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container"
                  title={showCreatorDashboard ? 'Creator' : 'Become a creator'}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {showCreatorDashboard ? 'palette' : 'auto_awesome'}
                  </span>
                </Link>
              )}
            </div>

            <div className="mt-auto space-y-1 pt-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className={cn(
                  'flex w-full items-center rounded-full py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface',
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
                            {accountInitials(user) || 'NuttyFans'}
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
            hideMobileChrome ? 'pb-0 md:pb-6' : 'pb-24 md:pb-6',
            sidebarExpanded ? 'md:ml-[290px]' : 'md:ml-[72px]'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {!isReelsRoute && !hideMobileChrome ? (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
            {navItems.map((item) => {
              // Keep Messages out of the mobile bottom tray.
              if (item.href === '/messages') return null;
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
                    active ? 'text-primary' : 'text-on-surface-variant'
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
      ) : null}
    </div>
  );
}
