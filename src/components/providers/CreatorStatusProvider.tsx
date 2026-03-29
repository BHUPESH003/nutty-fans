'use client';

import { useSession } from 'next-auth/react';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

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

interface CreatorStatusProviderProps {
  children: ReactNode;
}

export function CreatorStatusProvider({ children }: CreatorStatusProviderProps) {
  const { data: session, status, update } = useSession();

  const data = useMemo<CreatorStatus | null>(() => {
    if (!session?.user) return null;

    const onboardingStatus =
      ((session.user as { creatorOnboardingStatus?: string }).creatorOnboardingStatus as
        | OnboardingStatus
        | undefined) ?? 'not_started';

    return {
      onboardingStatus,
      isCreator: Boolean((session.user as { isCreator?: boolean }).isCreator),
    };
  }, [session]);

  return (
    <CreatorStatusContext.Provider
      value={{
        status: data ?? null,
        isLoading: status === 'loading',
        isError: false,
        refresh: () => {
          void update();
        },
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
