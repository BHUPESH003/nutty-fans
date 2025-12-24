'use client';

import {
  useCreatorStatusContext,
  type CreatorStatus,
} from '@/components/providers/CreatorStatusProvider';

interface UseCreatorStatusResult {
  status: CreatorStatus | null;
  onboardingStatus: string;
  isCreator: boolean;
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
}

/**
 * Hook to access creator status from the centralized provider.
 * Returns loading state if used outside provider (SSR-safe).
 */
export function useCreatorStatus(): UseCreatorStatusResult {
  const context = useCreatorStatusContext();

  // If no provider (e.g., during SSR), return loading state
  if (!context) {
    return {
      status: null,
      onboardingStatus: 'not_started',
      isCreator: false,
      isLoading: true, // Treat as loading when context not available
      isError: false,
      refresh: () => {},
    };
  }

  const { status, isLoading, isError, refresh } = context;

  return {
    status,
    onboardingStatus: status?.onboardingStatus ?? 'not_started',
    isCreator: status?.isCreator ?? false,
    isLoading,
    isError,
    refresh,
  };
}
