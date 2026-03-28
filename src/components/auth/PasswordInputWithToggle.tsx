'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type PasswordInputWithToggleProps = Omit<React.ComponentProps<typeof Input>, 'type'> & {
  id: string;
  label: React.ReactNode;
  trailingLabel?: React.ReactNode;
};

export function PasswordInputWithToggle({
  id,
  label,
  trailingLabel,
  className,
  ...inputProps
}: PasswordInputWithToggleProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {trailingLabel}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          className={cn('pr-12', className)}
          {...inputProps}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden>
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );
}
