'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
}

export function CategoryGrid({ categories, selectedCategory }: CategoryGridProps) {
  const pathname = usePathname();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>
      <div className="flex flex-wrap gap-2">
        <Link href="/explore">
          <Badge
            variant={!selectedCategory ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer px-4 py-2 text-sm transition-colors',
              !selectedCategory && 'bg-primary text-primary-foreground'
            )}
          >
            All
          </Badge>
        </Link>
        {categories.map((category) => {
          const isSelected =
            selectedCategory === category.id || pathname === `/explore/${category.slug}`;
          return (
            <Link key={category.id} href={`/explore/${category.slug}`}>
              <Badge
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer px-4 py-2 text-sm transition-colors',
                  isSelected && 'bg-primary text-primary-foreground'
                )}
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
