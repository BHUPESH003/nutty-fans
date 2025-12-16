'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import * as React from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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
        // For now treat all errors as generic credential issues.
        setError('Invalid email or password.');
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
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-h3">Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          {error ? <p className="text-sm text-[hsl(var(--accent-error))]">{error}</p> : null}
          <div className="flex items-center justify-between">
            <a href="/forgot-password" className="text-sm text-[hsl(var(--accent-primary))]">
              Forgot your password?
            </a>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-6">
          <div className="relative mb-3 flex items-center justify-center">
            <span className="h-px w-full bg-border" />
            <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
            <span className="h-px w-full bg-border" />
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'md' }),
                'w-full justify-center'
              )}
              onClick={() => {
                void signIn('google');
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'md' }),
                'w-full justify-center'
              )}
              onClick={() => {
                void signIn('apple');
              }}
            >
              Continue with Apple
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <div>
          <span>Don&apos;t have an account?</span>
          <a href="/register" className="ml-1 font-medium text-[hsl(var(--accent-primary))]">
            Sign up
          </a>
        </div>
        <a href="/creator/apply" className="text-[hsl(var(--accent-primary))] hover:underline">
          Want to become a creator? Apply here →
        </a>
      </CardFooter>
    </Card>
  );
}
