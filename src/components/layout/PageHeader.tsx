'use client';

import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

// Route label mapping for auto-generating breadcrumbs
const routeLabels: Record<string, string> = {
  creator: 'Creator',
  dashboard: 'Dashboard',
  posts: 'Posts',
  new: 'New Post',
  edit: 'Edit',
  earnings: 'Earnings',
  payouts: 'Payouts',
  setup: 'Setup',
  onboard: 'Onboarding',
  eligibility: 'Eligibility',
  category: 'Category',
  profile: 'Profile',
  pricing: 'Pricing',
  review: 'Review',
  verify: 'Verification',
  subscribers: 'Subscribers',
  subscription: 'Subscription',
};

export function PageHeader({
  title,
  subtitle,
  showBack = true,
  backHref,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const autoBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs) return breadcrumbs;

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;

      currentPath += `/${segment}`;

      // Skip dynamic segments like [id]
      if (segment.startsWith('[')) continue;

      const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);

      // Last item has no href (current page)
      items.push({
        label,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    }

    return items;
  };

  const crumbs = autoBreadcrumbs();
  const canGoBack = showBack && crumbs.length > 1;
  const backUrl = backHref ?? (crumbs.length > 1 ? crumbs[crumbs.length - 2]?.href : '/');

  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumbs */}
      {crumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
          {crumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {crumb.href ? (
                <Link
                  href={crumb.href as Route}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {canGoBack && backUrl && (
            <Link
              href={backUrl as Route}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
