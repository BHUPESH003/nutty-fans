'use client';

import React from 'react';

import { PublicAppShellContainer } from '@/components/containers/layout/PublicAppShellContainer';

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <PublicAppShellContainer>{children}</PublicAppShellContainer>;
}
