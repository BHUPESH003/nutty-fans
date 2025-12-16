'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuthPromptContextType {
  showAuthPrompt: (_action?: string) => void; // eslint-disable-line no-unused-vars
  hideAuthPrompt: () => void;
  isAuthenticated: boolean;
  requireAuth: (_action?: string) => boolean; // eslint-disable-line no-unused-vars
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
  const [isOpen, setIsOpen] = useState(false);
  const [actionDescription, setActionDescription] = useState<string | null>(null);

  const showAuthPrompt = useCallback((action?: string) => {
    setActionDescription(action ?? null);
    setIsOpen(true);
  }, []);

  const hideAuthPrompt = useCallback(() => {
    setIsOpen(false);
    setActionDescription(null);
  }, []);

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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              {actionDescription
                ? `You need to sign in to ${actionDescription}.`
                : 'You need to sign in to perform this action.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={() => router.push('/login')} size="lg">
              Sign In
            </Button>
            <Button onClick={() => router.push('/register')} variant="outline" size="lg">
              Create Account
            </Button>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Join thousands of creators and fans on NuttyFans
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AuthPromptContext.Provider>
  );
}
