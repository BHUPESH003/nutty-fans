'use client';

import * as React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { AuthPromptProvider } from '@/components/providers/AuthPromptProvider';
import { apiClient, ApiError } from '@/services/apiClient';

interface PublicAppShellContainerProps {
  children: React.ReactNode;
}

/**
 * PublicAppShellContainer - For pages that should be viewable by anonymous users
 * Unlike AppShellContainer, this doesn't redirect to login on 401
 * Uses AuthPromptProvider to show modal when actions require authentication
 */
export function PublicAppShellContainer({ children }: PublicAppShellContainerProps) {
  const [userSummary, setUserSummary] = React.useState<{
    id?: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const user = await apiClient.user.me();
        if (cancelled) return;
        setUserSummary({
          id: (user as unknown as Record<string, unknown>)['id'] as string | undefined,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: (user as unknown as { avatarUrl?: string | null }).avatarUrl ?? null,
        });
        setIsAuthenticated(true);
      } catch (err) {
        if (cancelled) return;
        // For public pages, we don't redirect on 401
        // Just leave user as null (anonymous)
        if (err instanceof ApiError && err.status === 401) {
          setUserSummary(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <AppShell user={null}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AuthPromptProvider isAuthenticated={isAuthenticated}>
      <AppShell user={userSummary}>{children}</AppShell>
    </AuthPromptProvider>
  );
}
