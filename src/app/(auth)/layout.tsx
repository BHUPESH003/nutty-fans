import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4">
      <div className="w-full max-w-md">
        <div className="text-center lg:mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-[hsl(var(--accent-primary))] text-sm font-semibold text-primary-foreground">
              NF
            </span>
            <div className="text-left">
              <div className="text-base font-semibold tracking-tight">NuttyFans</div>
              <div className="text-xs text-muted-foreground">Creator membership platform</div>
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
