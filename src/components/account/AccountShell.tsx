'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccountShellProps {
  children: React.ReactNode;
  isCreator: boolean;
}

const accountItems: Array<{ href: Route; label: string; icon: string }> = [
  { href: '/account/profile' as Route, label: 'Profile', icon: 'person' },
  { href: '/account/profile/edit' as Route, label: 'Edit Profile', icon: 'edit' },
  { href: '/account/settings' as Route, label: 'Settings', icon: 'settings' },
  { href: '/account/wallet' as Route, label: 'Wallet', icon: 'account_balance_wallet' },
  { href: '/account/subscriptions' as Route, label: 'Subscriptions', icon: 'subscriptions' },
] as const;

export function AccountShell({ children, isCreator }: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const creatorItems = isCreator
    ? [
        { href: '/creator/transactions' as Route, label: 'Transactions', icon: 'receipt_long' },
        { href: '/creator/payouts' as Route, label: 'Payouts', icon: 'payments' },
      ]
    : [];

  const navItems = [...accountItems, ...creatorItems];

  const handleLogout = React.useCallback(() => {
    void signOut({ redirect: true, callbackUrl: '/login' });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-2 pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+1.25rem)] sm:px-4 md:px-6 md:py-6">
      <div className="mb-3 flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-container-lowest"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div className="min-w-0">
          <p className="font-headline text-base font-bold text-on-surface">Account</p>
          <p className="text-[11px] leading-4 text-on-surface-variant sm:text-xs sm:leading-5">
            Profile, settings, wallet and memberships
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="hidden rounded-[24px] border border-border bg-surface-container-lowest p-4 md:block">
            <p className="font-headline text-xl font-bold text-on-surface">Account</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Keep your profile, preferences and billing in one place.
            </p>
          </div>

          <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 md:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-medium transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface-container-lowest text-on-surface-variant'
                  )}
                >
                  <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden rounded-[24px] border border-border bg-surface-container-lowest p-3 md:block">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Button variant="outline" className="mt-4 w-full" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
