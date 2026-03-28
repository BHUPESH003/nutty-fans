import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AuthScreenFrameProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  bannerTitle?: string;
  bannerSubtitle?: string;
  showBrand?: boolean;
  className?: string;
}

export function AuthScreenFrame({
  title,
  subtitle,
  children,
  footer,
  bannerTitle = 'Welcome back.',
  bannerSubtitle = 'Your creators are waiting.',
  showBrand = true,
  className,
}: AuthScreenFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[28px] bg-surface-container-lowest shadow-modal',
        className
      )}
    >
      <div className="rounded-b-[24px] bg-[#070913] px-6 pb-8 pt-7 text-white sm:px-7">
        {showBrand ? (
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/Group.svg"
              alt=""
              width={48}
              height={29}
              className="h-7 w-auto shrink-0"
              priority
              unoptimized
            />
            <span className="font-headline text-[2rem] font-extrabold leading-none tracking-tight text-primary-fixed-dim">
              NuttyFans
            </span>
          </Link>
        ) : null}
        <h1 className="mt-8 font-headline text-5xl font-bold tracking-tight">{bannerTitle}</h1>
        <p className="mt-2 text-lg text-white/70">{bannerSubtitle}</p>
      </div>

      <div className="px-6 pb-8 pt-6 sm:px-7">
        <div className="mb-6 text-center">
          <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">
            {title}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p>
        </div>

        {children}

        {footer ? (
          <>
            <Separator className="my-6 bg-surface-container-high" />
            <div className="text-center text-sm text-on-surface-variant">{footer}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
