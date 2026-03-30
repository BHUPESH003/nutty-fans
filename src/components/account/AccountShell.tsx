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
        { href: '/account/transactions' as Route, label: 'Transactions', icon: 'receipt_long' },
        { href: '/account/payouts' as Route, label: 'Payouts', icon: 'payments' },
      ]
    : [];

  const navItems = [...accountItems, ...creatorItems];

  const handleLogout = React.useCallback(() => {
    void signOut({ redirect: true, callbackUrl: '/login' });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-2 pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom)+1.25rem)] sm:px-4 md:px-6 md:py-6">
      <section className="rounded-[24px] border border-border bg-surface-container-lowest p-3 sm:p-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-container-lowest md:hidden"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="font-headline text-base font-bold text-on-surface sm:text-lg">Account</p>
            <p className="truncate text-[11px] leading-4 text-on-surface-variant sm:text-xs sm:leading-5">
              Profile, settings, wallet and memberships
            </p>
          </div>

          <Button variant="outline" className="hidden md:inline-flex" onClick={handleLogout}>
            Log out
          </Button>
        </div>

        <nav className="mt-3 flex min-w-0 flex-wrap gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition sm:text-sm',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                )}
              >
                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <Button variant="outline" className="md:hidden" onClick={handleLogout}>
            Log out
          </Button>
        </nav>
      </section>

      <section className="mt-4 w-full min-w-0 overflow-x-hidden">{children}</section>
    </div>
  );
}
