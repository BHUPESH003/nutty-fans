'use client';

import { PersonalizedFeed } from '@/components/feed/PersonalizedFeed';
import { PublicFeed } from '@/components/feed/PublicFeed';
import { useAuthPrompt } from '@/components/providers/AuthPromptProvider';

export function HomeFeedWrapper() {
  const { isAuthenticated } = useAuthPrompt();

  return <>{isAuthenticated ? <PersonalizedFeed /> : <PublicFeed />}</>;
}
