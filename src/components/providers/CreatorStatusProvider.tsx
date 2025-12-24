'use client';

import { createContext, useContext, type ReactNode } from 'react';
import useSWR from 'swr';

type OnboardingStatus =
  | 'not_started'
  | 'eligibility'
  | 'category_selection'
  | 'profile_setup'
  | 'pricing_setup'
  | 'review_pending'
  | 'kyc_required'
  | 'kyc_in_progress'
  | 'payout_setup'
  | 'active';

export interface CreatorStatus {
  onboardingStatus: OnboardingStatus;
  isCreator: boolean;
}

interface CreatorStatusContextType {
  status: CreatorStatus | null;
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
}

const CreatorStatusContext = createContext<CreatorStatusContextType | null>(null);

const fetcher = async (url: string): Promise<CreatorStatus> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch creator status');
  }
  const data = await response.json();
  return {
    onboardingStatus: data.data?.onboardingStatus || 'not_started',
    isCreator: data.data?.onboardingStatus === 'active',
  };
};

interface CreatorStatusProviderProps {
  children: ReactNode;
}

export function CreatorStatusProvider({ children }: CreatorStatusProviderProps) {
  const { data, error, isLoading, mutate } = useSWR<CreatorStatus>('/api/creator/status', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Deduplicate requests within 60 seconds
  });

  return (
    <CreatorStatusContext.Provider
      value={{
        status: data ?? null,
        isLoading,
        isError: !!error,
        refresh: () => mutate(),
      }}
    >
      {children}
    </CreatorStatusContext.Provider>
  );
}

export function useCreatorStatusContext() {
  const context = useContext(CreatorStatusContext);
  // Return null instead of throwing - allows SSR and graceful degradation
  return context;
}
