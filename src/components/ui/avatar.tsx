import * as AvatarPrimitives from '@radix-ui/react-avatar';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitives.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitives.Root
    ref={ref}
    className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full border border-border bg-muted',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitives.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitives.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitives.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitives.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitives.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitives.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitives.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitives.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitives.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
