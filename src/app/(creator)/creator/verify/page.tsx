'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

interface KycStatusResponse {
  status: KycStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

export default function CreatorVerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchKycStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKycStatus = async () => {
    try {
      const response = await fetch('/api/creator/kyc/status');
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data);

        if (data.status === 'approved') {
          router.push('/creator/payouts/setup');
        }
      }
    } catch {
      // Status not found - user needs to start KYC
    } finally {
      setKycLoading(false);
    }
  };

  const startVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/creator/kyc/start', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to start verification');
      }

      // Redirect to Veriff hosted flow
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (kycLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderStatusContent = () => {
    if (!kycStatus || kycStatus.status === 'pending') {
      return (
        <>
          <CardDescription>
            To become a verified creator, you&apos;ll need to complete identity verification. This
            process is handled securely by our verification partner.
          </CardDescription>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium">Government ID</p>
                  <p className="text-sm text-muted-foreground">
                    A valid passport, driver&apos;s license, or national ID
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium">Selfie Photo</p>
                  <p className="text-sm text-muted-foreground">
                    A clear photo of your face for verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium">Proof of Address</p>
                  <p className="text-sm text-muted-foreground">
                    Recent utility bill or bank statement
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
            )}

            <Button onClick={startVerification} className="w-full" disabled={loading}>
              {loading ? 'Starting Verification...' : 'Start Identity Verification'}
            </Button>
          </CardContent>
        </>
      );
    }

    if (kycStatus.status === 'submitted') {
      return (
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-lg font-medium">Verification In Progress</h3>
            <p className="text-muted-foreground">
              Your documents are being reviewed. This usually takes a few minutes to a few hours.
              We&apos;ll notify you once the verification is complete.
            </p>
            <Button variant="outline" onClick={fetchKycStatus}>
              Check Status
            </Button>
          </div>
        </CardContent>
      );
    }

    if (kycStatus.status === 'rejected') {
      return (
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-medium text-destructive">Verification Failed</h3>
            <p className="text-muted-foreground">
              {kycStatus.rejectionReason ||
                'Your verification could not be completed. Please try again.'}
            </p>
            <Button onClick={startVerification} disabled={loading}>
              {loading ? 'Starting...' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Identity Verification</h1>
        <p className="mt-2 text-muted-foreground">
          Secure verification to protect you and your subscribers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          {renderStatusContent()}
        </CardHeader>
      </Card>
    </div>
  );
}
