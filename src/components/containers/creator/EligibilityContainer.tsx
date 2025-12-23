'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
];

const CONTENT_TYPES = [
  { value: 'sfw', label: 'Safe for Work (SFW)', description: 'Family-friendly content only' },
  { value: 'nsfw', label: 'Adult Content (NSFW)', description: 'Age-restricted adult content' },
  { value: 'both', label: 'Mixed Content', description: 'Both SFW and NSFW content' },
];

export const EligibilityContainer = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ageConfirmed: false,
    country: '',
    contentTypeIntent: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.ageConfirmed) {
      setError('You must confirm you are 18 or older');
      return;
    }

    if (!formData.country) {
      setError('Please select your country');
      return;
    }

    if (!formData.contentTypeIntent) {
      setError('Please select your content type');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/creator/apply/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit eligibility');
      }

      router.push(data.data.nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={1} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Eligibility Check</CardTitle>
          <CardDescription>
            Let&apos;s make sure you meet our requirements to become a creator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Age Confirmation */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="ageConfirmed"
                checked={formData.ageConfirmed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ageConfirmed: checked === true })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="ageConfirmed" className="cursor-pointer font-medium">
                  I confirm I am 18 years or older
                </Label>
                <p className="text-sm text-muted-foreground">
                  You must be at least 18 years old to become a creator.
                </p>
              </div>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <Label htmlFor="country">Country of Residence</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This determines tax requirements and payout options.
              </p>
            </div>

            {/* Content Type Intent */}
            <div className="space-y-3">
              <Label>What type of content will you create?</Label>
              <div className="grid gap-3">
                {CONTENT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.contentTypeIntent === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="contentTypeIntent"
                        value={type.value}
                        checked={formData.contentTypeIntent === type.value}
                        onChange={(e) =>
                          setFormData({ ...formData, contentTypeIntent: e.target.value })
                        }
                        className="sr-only"
                      />
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.contentTypeIntent === type.value
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {formData.contentTypeIntent === type.value && (
                          <div className="m-0.5 h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/creator/start')}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Checking...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
