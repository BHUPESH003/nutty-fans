'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, type ReactNode } from 'react';

interface AuthPromptContextType {
  showAuthPrompt: (_action?: string) => void;
  hideAuthPrompt: () => void;
  isAuthenticated: boolean;
  requireAuth: (_action?: string) => boolean;
}

const AuthPromptContext = createContext<AuthPromptContextType | null>(null);

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error('useAuthPrompt must be used within AuthPromptProvider');
  }
  return context;
}

interface AuthPromptProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export function AuthPromptProvider({ children, isAuthenticated }: AuthPromptProviderProps) {
  const router = useRouter();

  const redirectToAuth = useCallback(
    (path: '/login' | '/register' = '/login') => {
      const callbackUrl =
        typeof window === 'undefined'
          ? '/'
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;

      router.push(`${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    },
    [router]
  );

  const showAuthPrompt = useCallback(
    (action?: string) => {
      if (process.env.NODE_ENV === 'development' && action) {
        // eslint-disable-next-line no-console
        console.info(`[AuthPrompt] Redirecting to login for action: ${action}`);
      }

      redirectToAuth('/login');
    },
    [redirectToAuth]
  );

  const hideAuthPrompt = useCallback(() => {}, []);

  const requireAuth = useCallback(
    (action?: string): boolean => {
      if (isAuthenticated) return true;
      showAuthPrompt(action);
      return false;
    },
    [isAuthenticated, showAuthPrompt]
  );

  return (
    <AuthPromptContext.Provider
      value={{ showAuthPrompt, hideAuthPrompt, isAuthenticated, requireAuth }}
    >
      {children}
    </AuthPromptContext.Provider>
  );
}
