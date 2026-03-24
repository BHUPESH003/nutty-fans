import { Suspense } from 'react';

import { LoginContainer } from '@/components/containers/LoginContainer';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-on-surface-variant">Loading...</div>}>
      <LoginContainer />
    </Suspense>
  );
}
