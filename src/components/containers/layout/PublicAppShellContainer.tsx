'use client';

import * as React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { AuthPromptProvider } from '@/components/providers/AuthPromptProvider';
import { useAuth } from '@/hooks/useAuth';

interface PublicAppShellContainerProps {
  children: React.ReactNode;
}

/**
 * PublicAppShellContainer - For pages that should be viewable by anonymous users
 * Unlike AppShellContainer, this doesn't redirect to login on 401
 * Uses AuthPromptProvider to show modal when actions require authentication
 */
export function PublicAppShellContainer({ children }: PublicAppShellContainerProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <AppShell user={user}>{children}</AppShell>
    </AuthPromptProvider>
  );
}
