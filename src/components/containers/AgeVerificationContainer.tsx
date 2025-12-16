'use client';

export function AgeVerificationContainer() {
  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-h3">Creator age verification</h1>
      <p className="text-sm text-muted-foreground">
        Age and identity verification for creators will be introduced in a dedicated onboarding
        flow. Regular fans can continue to use NuttyFans without completing KYC.
      </p>
      <p className="text-xs text-muted-foreground">
        When this feature launches, you&apos;ll be guided through a secure third-party verification
        process as part of creator onboarding.
      </p>
    </div>
  );
}
