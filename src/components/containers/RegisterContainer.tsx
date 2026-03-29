'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import * as React from 'react';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { PasswordInputWithToggle } from '@/components/auth/PasswordInputWithToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiClient, ApiError } from '@/services/apiClient';

interface RegisterFormState {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
}

export function RegisterContainer() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [form, setForm] = React.useState<RegisterFormState>({
    email: '',
    password: '',
    displayName: '',
    acceptTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.auth.register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        acceptTerms: form.acceptTerms,
      });

      if (!isMountedRef.current) return;
      setSuccessMessage('Account created. Check your email to verify your account. Redirecting...');
      setTimeout(() => {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }, 1200);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'Unable to sign up. Please try again.';
      setError(msg);
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AuthScreenFrame
      title="Create account"
      subtitle="Join NF and start connecting with your community."
      bannerTitle="Join NF."
      bannerSubtitle="Premium creators. Exclusive experiences."
    >
      <Button
        variant="outline"
        className="h-12 w-full border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
        onClick={() => void signIn('google', { callbackUrl })}
      >
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-4">
        <Separator className="bg-surface-container-high" />
        <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
          or
        </span>
        <Separator className="bg-surface-container-high" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            required
            value={form.displayName}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
          />
        </div>

        <PasswordInputWithToggle
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={handleChange}
        />

        <label className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            checked={form.acceptTerms}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-outline-variant"
          />
          <span>
            I agree to the{' '}
            <a href="#" className="font-semibold text-primary hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={isSubmitting || !form.acceptTerms}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>

        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        {successMessage ? (
          <p className="text-center text-sm text-emerald-600">{successMessage}</p>
        ) : null}
      </form>

      <p className="mt-6 text-center text-base text-on-surface-variant">
        Already have an account?{' '}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthScreenFrame>
  );
}
