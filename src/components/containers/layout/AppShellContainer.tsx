'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { apiClient, ApiError } from '@/services/apiClient';

interface AppShellContainerProps {
  children: React.ReactNode;
}

export function AppShellContainer({ children }: AppShellContainerProps) {
  const [userSummary, setUserSummary] = React.useState<{
    displayName?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const user = await apiClient.user.me();
        if (cancelled) return;
        setUserSummary({
          displayName: user.displayName,
          username: user.username,
          avatarUrl: (user as unknown as { avatarUrl?: string | null }).avatarUrl ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <AppShell user={userSummary}>{children}</AppShell>;
}
