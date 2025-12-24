'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreatorNavButtonProps {
  className?: string;
  variant?: 'default' | 'icon';
}

type OnboardingStatus = 'not_started' | 'active' | string;

export function CreatorNavButton({ className, variant = 'default' }: CreatorNavButtonProps) {
  const [status, setStatus] = useState<OnboardingStatus>('not_started');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/creator/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data.data?.onboardingStatus || 'not_started');
        }
      } catch (error) {
        console.error('Failed to fetch creator status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, []);

  // Only show for active creators
  if (isLoading || status !== 'active') {
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
