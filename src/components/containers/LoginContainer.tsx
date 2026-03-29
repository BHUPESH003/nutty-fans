'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import * as React from 'react';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { PasswordInputWithToggle } from '@/components/auth/PasswordInputWithToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ApiError } from '@/services/apiClient';

interface LoginFormState {
  email: string;
  password: string;
}

export interface LoginContainerProps {
  onLoggedIn?: () => void;
}

export function LoginContainer({ onLoggedIn }: LoginContainerProps) {
  const [form, setForm] = React.useState<LoginFormState>({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isMountedRef = React.useRef(true);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const { data: session } = useSession();

  React.useEffect(() => {
    if (session) {
      window.location.href = callbackUrl;
    }
  }, [session, callbackUrl]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!isMountedRef.current) return;

      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin' ? 'Invalid email or password.' : result.error
        );
        setIsSubmitting(false);
        return;
      }

      if (onLoggedIn) {
        onLoggedIn();
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'Unable to sign in. Please try again.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenFrame
      title="Sign in"
      subtitle="Access your account and continue where you left off."
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
          trailingLabel={
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Forgot?
            </Link>
          }
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
        />

        <Button disabled={isSubmitting} className="h-12 w-full text-base">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>

        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
      </form>

      <p className="mt-6 text-center text-base text-on-surface-variant">
        No account?{' '}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthScreenFrame>
  );
}
