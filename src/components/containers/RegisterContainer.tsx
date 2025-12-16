'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/services/apiClient';

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  username: string;
  dateOfBirth: string;
  country: string;
  acceptTerms: boolean;
}

export interface RegisterContainerProps {
  onRegistered?: () => void;
}

export function RegisterContainer({ onRegistered }: RegisterContainerProps) {
  const [form, setForm] = React.useState<RegisterFormState>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    username: '',
    dateOfBirth: '',
    country: '',
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

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.auth.register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        username: form.username || undefined,
        dateOfBirth: form.dateOfBirth,
        country: form.country,
        acceptTerms: form.acceptTerms,
      });

      if (!isMountedRef.current) return;
      setSuccessMessage('Check your email to verify your account.');
      if (onRegistered) {
        onRegistered();
      }
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
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle className="text-h3">Create your account</CardTitle>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              required
              value={form.displayName}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input id="username" name="username" value={form.username} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                placeholder="Country"
                required
                value={form.country}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              />
              <p className="text-xs text-muted-foreground">
                At least 12 characters, including upper &amp; lower case, number, and symbol.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="mt-1"
            />
            <Label htmlFor="acceptTerms" className="text-sm">
              I&apos;ve read and agree to the{' '}
              <a href="/terms" className="text-[hsl(var(--accent-primary))] underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[hsl(var(--accent-primary))] underline">
                Privacy Policy
              </a>
              .
            </Label>
          </div>
          {error ? <p className="text-sm text-[hsl(var(--accent-error))]">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm text-[hsl(var(--accent))]">{successMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting || !form.acceptTerms}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border pt-4 text-sm text-muted-foreground">
        <span>Already have an account?</span>
        <a href="/login" className="ml-1 font-medium text-[hsl(var(--accent-primary))]">
          Sign in
        </a>
      </CardFooter>
    </Card>
  );
}
