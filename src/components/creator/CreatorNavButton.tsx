'use client';

import { Plus } from 'lucide-react';
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
        <Link href="/creator/posts/new">
          <Plus className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  return (
    <Button className={cn('gap-2 rounded-full', className)} asChild>
      <Link href="/creator/posts/new">
        <Plus className="h-4 w-4" />
        Create
      </Link>
    </Button>
  );
}
