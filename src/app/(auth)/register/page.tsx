import { Suspense } from 'react';

import { RegisterContainer } from '@/components/containers/RegisterContainer';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-on-surface-variant">Loading...</div>}>
      <RegisterContainer />
    </Suspense>
  );
}
