'use client';

import { useSession } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/apiClient';
import { AuthUser } from '@/types/auth';

export function VerificationBanner() {
  const { data: session } = useSession();
  const [isResending, setIsResending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const user = session?.user as AuthUser | undefined;

  if (!user || user.accountState !== 'email_unverified') {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      await apiClient.auth.resendVerification({ email: user.email });
      setMessage('Verification email sent!');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setMessage('Failed to send email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-center sm:text-left">
          Please verify your email address to access all features.
          {message && <span className="ml-2 font-medium text-primary">{message}</span>}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={isResending}
          className="h-8 border-yellow-500/30 bg-transparent text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </Button>
      </div>
    </div>
  );
}
