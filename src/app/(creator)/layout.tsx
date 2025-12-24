'use client';

import { redirect, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { CreatorStatusProvider } from '@/components/providers/CreatorStatusProvider';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login with callback to return to current page
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const user = session?.user
    ? {
        id: session.user.id,
        displayName: session.user.name ?? '',
        avatarUrl: session.user.image ?? null,
      }
    : null;

  return (
    <CreatorStatusProvider>
      <AppShell user={user}>
        <div className="mx-auto max-w-4xl py-8">{children}</div>
      </AppShell>
    </CreatorStatusProvider>
  );
}
