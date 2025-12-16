import { Suspense } from 'react';

import { LoginContainer } from '@/components/containers/LoginContainer';

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContainer />
      </Suspense>
    </main>
  );
}
