'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { CreatorStatusProvider } from '@/components/providers/CreatorStatusProvider';
import { useAuth } from '@/hooks/useAuth';

interface AppShellContainerProps {
  children: React.ReactNode;
}

export function AppShellContainer({ children }: AppShellContainerProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <AppShell user={null}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <CreatorStatusProvider>
      <AppShell user={user}>{children}</AppShell>
    </CreatorStatusProvider>
  );
}
