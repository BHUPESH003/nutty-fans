import type { ReactNode } from 'react';

/**
 * Full-viewport layouts (age gate) — no auth max-width wrapper.
 */
export default function GateLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
