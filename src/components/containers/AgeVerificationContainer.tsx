'use client';

import Link from 'next/link';

import { AuthScreenFrame } from '@/components/auth/AuthScreenFrame';
import { Button } from '@/components/ui/button';

export function AgeVerificationContainer() {
  return (
    <AuthScreenFrame
      title="Age verification"
      subtitle="Creator identity verification will be available during onboarding."
      bannerTitle="Creator onboarding."
      bannerSubtitle="Verification tools are coming soon."
      showBrand={false}
    >
      <div className="space-y-4 rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant">
        <p>
          Age and identity verification for creators will be introduced in a dedicated onboarding
          flow.
        </p>
        <p>
          Regular fans can continue using NuttyFans without completing KYC. Once this feature is
          live, we will guide creators through a secure third-party process.
        </p>
      </div>

      <Button asChild className="mt-6 h-12 w-full text-base">
        <Link href="/">Return home</Link>
      </Button>
    </AuthScreenFrame>
  );
}
