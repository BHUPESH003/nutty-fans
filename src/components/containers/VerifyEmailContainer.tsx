'use client';

import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          setMessage('Your email has been verified. You can now continue to NuttyFans.');
        } else {
          setStatus('error');
          setMessage(
            result.error || 'We could not verify this link. It may be expired or already used.'
          );
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
      setResendMessage(
        'If an account exists for this email, a verification email was sent. Please check your inbox.'
      );
    } catch (err) {
      if (!isMountedRef.current) return;
      // For privacy and security, show the same generic message even on error.
      setResendMessage(
        'If an account exists for this email, a verification email was sent. Please check your inbox.'
      );
      console.error(err instanceof ApiError ? err.message : err);
    } finally {
      if (isMountedRef.current) {
        setIsResending(false);
      }
    }
  };

  let title = 'Verify your email';
  if (status === 'verifying') {
    title = 'Verifying…';
  } else if (status === 'success') {
    title = 'Email verified';
  } else if (status === 'error') {
    title = 'Verification problem';
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-h3">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' ? (
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to your email. Open it on this device to complete
            verification.
          </p>
        ) : null}
        {status === 'verifying' ? (
          <p className="text-sm text-muted-foreground">
            Hold tight while we verify your email link…
          </p>
        ) : null}
        {status === 'success' ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your email address is confirmed. Some areas of NuttyFans may still require age
              verification.
            </p>
            <div className="flex justify-between gap-2">
              <Button asChild variant="outline">
                <Link href="/">Go to home</Link>
              </Button>
              <Button asChild>
                <Link href="/age-verification">Continue to age verification</Link>
              </Button>
            </div>
          </>
        ) : null}
        {status === 'error' ? (
          <>
            <p className="text-sm text-[hsl(var(--accent-error))]">{message}</p>
            <p className="text-sm text-muted-foreground">
              This link may be invalid or expired. You can request a new verification email below.
            </p>
            <form onSubmit={handleResend} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="resendEmail">Email</Label>
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
                <p className="text-sm text-muted-foreground">{resendMessage}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isResending}>
                {isResending ? 'Sending…' : 'Resend verification email'}
              </Button>
            </form>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </>
        ) : null}
        {status === 'idle' && !message ? null : null}
      </CardContent>
    </Card>
  );
}
