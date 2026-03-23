'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useCreatorStatus } from '@/hooks/useCreatorStatus';
import { cn } from '@/lib/utils';

interface CreatorNavButtonProps {
  className?: string;
  variant?: 'default' | 'icon';
}

export function CreatorNavButton({ className, variant = 'default' }: CreatorNavButtonProps) {
  const { onboardingStatus, isLoading } = useCreatorStatus();

  // Only show for active creators
  if (isLoading || onboardingStatus !== 'active') {
    return null;
  }

  if (variant === 'icon') {
    return (
      <Button size="icon" className={cn('h-10 w-10 rounded-full', className)} asChild>
        <Link href="/creator/posts/new" aria-label="Create post">
          <span className="material-symbols-outlined text-[22px]">add</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button className={cn('gap-2 rounded-full', className)} asChild>
      <Link href="/creator/posts/new">
        <span className="material-symbols-outlined text-[18px]">add</span>
        Create
      </Link>
    </Button>
  );
}
