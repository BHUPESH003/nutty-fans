'use client';

import Link from 'next/link';
import * as React from 'react';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/services/apiClient';

export interface ResetPasswordContainerProps {
  token: string | null;
}

export function ResetPasswordContainer({ token }: ResetPasswordContainerProps) {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

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

    if (!token) {
      setError('Invalid or missing reset link. Please request a new one.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.auth.resetPassword({ token, newPassword: password });
      if (!isMountedRef.current) return;
      setMessage('Your password has been updated. You can now sign in.');
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'This link is invalid or expired. Request a new reset link.';
      setError(msg);
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthScreenFrame
      title="Reset password"
      subtitle="Choose a new strong password for your account."
      bannerTitle="Set a new password."
      bannerSubtitle="Keep your account secure."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </Button>

        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-center text-sm text-emerald-600">{message}</p> : null}
      </form>

      <p className="mt-6 text-center text-base text-on-surface-variant">
        Return to{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          sign in
        </Link>
      </p>
    </AuthScreenFrame>
  );
}
