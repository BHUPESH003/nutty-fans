import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-y-auto bg-surface-container-low px-4 py-4 sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-md sm:max-h-[calc(100dvh-3rem)]">{children}</div>
    </div>
  );
}
