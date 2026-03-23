import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-0 px-3 py-1 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-container/10 text-primary-container',
        secondary: 'bg-secondary/10 text-secondary',
        destructive: 'bg-error/10 text-error',
        outline: 'border border-outline-variant text-on-surface-variant',
        live: 'badge-live border-0 p-0',
        verified: 'verified-halo bg-secondary px-2 py-0.5 text-[10px] font-bold text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
