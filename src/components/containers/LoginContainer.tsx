'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const router = useRouter();

  React.useEffect(() => {
    if (session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(callbackUrl as any);
    }
  }, [session, router, callbackUrl]);

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
        // Handle specific errors (e.g. from AuthService) or generic credentials error
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password.');
        } else {
          setError(result.error);
        }
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
    <div className="flex min-h-[calc(100vh_-_var(--header-h))] w-full bg-background lg:grid">
      {/* Left Side - Lifestyle Image */}
      <div className="relative hidden h-full flex-col bg-muted p-8 text-white dark:border-r dark:border-white/5 lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-900/40" />
        {/* Placeholder for actual image - using a gradient for now */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />

        {/* <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            NF
          </div>
          NuttyFans
        </div> */}
        <div className="relative z-20">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform has completely transformed how I connect with my audience. The
              premium feel makes everything more exclusive.&rdquo;
            </p>
            <footer className="text-sm text-white/80">Sofia Davis, Creator</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-8 lg:pb-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="border-white/10 bg-muted/50 focus:border-primary/50"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="border-white/10 bg-muted/50 focus:border-primary/50"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button disabled={isSubmitting} className="w-full shadow-lg shadow-primary/20">
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid gap-4">
              <Button
                variant="outline"
                onClick={() => void signIn('google', { callbackUrl: '/' })}
                className="bg-background hover:bg-muted"
              >
                Google
              </Button>
            </div>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/register" className="underline underline-offset-4 hover:text-primary">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
