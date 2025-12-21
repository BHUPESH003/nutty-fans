'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/services/apiClient';

interface RegisterFormState {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
}

export function RegisterContainer() {
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    const checked = type === 'checkbox' && 'checked' in event.target ? event.target.checked : false;
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

      if (!isMountedRef.current) return;

      setSuccessMessage(
        'Account created! Please check your email to verify your account. Redirecting to login...'
      );

      // Redirect to login page after short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
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
    <div className="flex min-h-[calc(100vh_-_var(--header-h))] w-full bg-background lg:grid">
      {/* Left Side - Lifestyle Image */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r dark:border-white/5 lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-900/40" />
        {/* Placeholder for actual image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1964&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />

        {/* <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            NF
          </div>
          NuttyFans
        </div> */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Join the fastest growing community of creators and fans. Start your journey
              today.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-8 lg:pb-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-4 sm:w-[450px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                placeholder="name@example.com"
                className="border-white/10 bg-muted/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                value={form.displayName}
                onChange={handleChange}
                placeholder="John Doe"
                className="border-white/10 bg-muted/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="border-white/10 bg-muted/50 focus:border-primary/50"
              />
            </div>

            <div className="flex items-start space-x-2 rounded-md border border-muted p-4">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={form.acceptTerms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor="acceptTerms"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                I agree to the{' '}
                <a href="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </Label>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-500">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full shadow-lg shadow-primary/20"
              disabled={isSubmitting || !form.acceptTerms}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => void signIn('google')}
            className="bg-background hover:bg-muted"
          >
            Google
          </Button>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
