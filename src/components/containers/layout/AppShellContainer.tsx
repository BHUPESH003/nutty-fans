'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';

interface AppShellContainerProps {
  children: React.ReactNode;
}

export function AppShellContainer({ children }: AppShellContainerProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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

  return <AppShell user={user}>{children}</AppShell>;
}
