import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-low px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
