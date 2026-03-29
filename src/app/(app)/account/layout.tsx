'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { AccountShell } from '@/components/account/AccountShell';
import { useAuth } from '@/hooks/useAuth';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname || '/account/profile')}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[32px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  return <AccountShell isCreator={Boolean(user?.isCreator)}>{children}</AccountShell>;
}
