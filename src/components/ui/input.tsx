import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full rounded-[12px] border-none bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
