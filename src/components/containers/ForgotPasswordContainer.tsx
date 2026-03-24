'use client';

import Link from 'next/link';
import * as React from 'react';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/services/apiClient';

export function ForgotPasswordContainer() {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.auth.forgotPassword({ email });
      if (!isMountedRef.current) return;
      setMessage('If an account exists for this email, we sent reset instructions.');
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'Unable to process your request. Please try again.';
      setError(msg);
      setMessage('If an account exists for this email, we sent reset instructions.');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthScreenFrame
      title="Forgot password"
      subtitle="Enter your email and we will send you a reset link."
      bannerTitle="Recover access."
      bannerSubtitle="Securely reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Sending link…' : 'Send reset link'}
        </Button>

        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-center text-sm text-on-surface-variant">{message}</p> : null}
      </form>

      <p className="mt-6 text-center text-base text-on-surface-variant">
        Back to{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          sign in
        </Link>
      </p>
    </AuthScreenFrame>
  );
}
