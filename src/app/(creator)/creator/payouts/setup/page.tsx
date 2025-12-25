import { Suspense } from 'react';

import { PayoutSetupContainer } from '@/components/containers/creator/PayoutSetupContainer';

export default function PayoutSetupPage() {
  // `useSearchParams` is used in the container, so we wrap in Suspense per Next.js guidance.
  return (
    <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
      <PayoutSetupContainer />
    </Suspense>
  );
}
