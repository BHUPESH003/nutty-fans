'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface CategoryGridProps {
  categories: Category[];
  selectedCategory?: string;
  /** Pills in a horizontal strip (Discover mockup) */
  variant?: 'default' | 'chips';
}

export function CategoryGrid({
  categories,
  selectedCategory,
  variant = 'default',
}: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  const chipList = (
    <>
      <Link href="/explore">
        <Badge
          variant={!selectedCategory ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer whitespace-nowrap transition-colors',
            variant === 'chips'
              ? 'rounded-full px-4 py-1.5 text-xs font-semibold'
              : 'px-4 py-2 text-sm',
            !selectedCategory && 'border-transparent bg-primary text-primary-foreground shadow-none'
          )}
        >
          All
        </Badge>
      </Link>
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <Link key={category.id} href={`/explore?category=${encodeURIComponent(category.slug)}`}>
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer whitespace-nowrap transition-colors',
                variant === 'chips'
                  ? 'rounded-full px-4 py-1.5 text-xs font-semibold'
                  : 'px-4 py-2 text-sm',
                isSelected && 'border-transparent bg-primary text-primary-foreground shadow-none',
                variant === 'chips' &&
                  !isSelected &&
                  'border-transparent bg-surface-container-high font-semibold text-on-surface hover:bg-surface-container-highest'
              )}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </Badge>
          </Link>
        );
      })}
    </>
  );

  if (variant === 'chips') {
    return <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 pt-1">{chipList}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <div className="flex flex-wrap gap-2">{chipList}</div>
    </div>
  );
}
