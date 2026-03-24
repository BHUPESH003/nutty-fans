'use client';

import Link from 'next/link';
import * as React from 'react';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/services/apiClient';

export interface VerifyEmailContainerProps {
  token: string | null;
}

export function VerifyEmailContainer({ token }: VerifyEmailContainerProps) {
  const [status, setStatus] = React.useState<'idle' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'idle'
  );
  const [message, setMessage] = React.useState<string | null>(null);
  const [emailForResend, setEmailForResend] = React.useState('');
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [isResending, setIsResending] = React.useState(false);

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    const verify = async () => {
      if (!token) return;
      setStatus('verifying');
      setMessage(null);

      try {
        const result = await apiClient.auth.verifyEmail({ token });
        if (!isMountedRef.current) return;
        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified.');
        } else {
          setStatus('error');
          setMessage(result.error || 'This link may be expired or already used.');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        const msg =
          err instanceof ApiError && err.message
            ? err.message
            : 'We could not verify this link. It may be expired or already used.';
        setStatus('error');
        setMessage(msg);
      }
    };

    void verify();
  }, [token]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResendMessage(null);
    setIsResending(true);

    try {
      await apiClient.auth.resendVerification({ email: emailForResend });
      if (!isMountedRef.current) return;
      setResendMessage('If an account exists, a fresh verification email has been sent.');
    } catch (err) {
      if (!isMountedRef.current) return;
      setResendMessage('If an account exists, a fresh verification email has been sent.');
      console.error(err instanceof ApiError ? err.message : err);
    } finally {
      if (isMountedRef.current) {
        setIsResending(false);
      }
    }
  };

  return (
    <AuthScreenFrame
      title={
        status === 'verifying'
          ? 'Verifying…'
          : status === 'success'
            ? 'Email verified'
            : status === 'error'
              ? 'Verification issue'
              : 'Verify your email'
      }
      subtitle="Confirm your email to unlock your full account access."
      bannerTitle="Secure account setup."
      bannerSubtitle="One more step before you continue."
    >
      {status === 'idle' ? (
        <p className="text-center text-sm text-on-surface-variant">
          We sent a verification link to your inbox. Open it on this device to finish setup.
        </p>
      ) : null}

      {status === 'verifying' ? (
        <p className="text-center text-sm text-on-surface-variant">
          Checking your verification link…
        </p>
      ) : null}

      {status === 'success' ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-emerald-600">{message}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="h-11">
              <Link href="/">Go home</Link>
            </Button>
            <Button asChild className="h-11">
              <Link href="/age-verification">Continue</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-destructive">{message}</p>
          <form onSubmit={handleResend} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="resendEmail">Email address</Label>
              <Input
                id="resendEmail"
                type="email"
                autoComplete="email"
                required
                value={emailForResend}
                onChange={(event) => setEmailForResend(event.target.value)}
              />
            </div>
            {resendMessage ? (
              <p className="text-center text-sm text-on-surface-variant">{resendMessage}</p>
            ) : null}
            <Button type="submit" className="h-11 w-full" disabled={isResending}>
              {isResending ? 'Sending…' : 'Resend verification email'}
            </Button>
          </form>
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : null}
    </AuthScreenFrame>
  );
}
