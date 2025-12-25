'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

interface BundleRow {
  id: string;
  title: string;
  price: unknown;
  itemCount: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export function CreatorBundlesContainer() {
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.bundles.listMy();
      setBundles((res.bundles || []) as BundleRow[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleActivate = async (bundleId: string) => {
    await apiClient.bundles.activate(bundleId);
    await load();
  };

  const formatPrice = (p: unknown) => {
    const n = typeof p === 'number' ? p : Number(p);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundles"
        subtitle="Sell a collection of posts as one purchase."
        actions={
          <Button asChild>
            <Link href={'/creator/bundles/new' as Route}>New bundle</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : bundles.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No bundles yet. Create one to start selling PPV collections.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bundles.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{b.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatPrice(b.price)}</span>
                    <span>{b.itemCount} items</span>
                    <span className="capitalize">{b.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/creator/bundles/${b.id}/edit` as Route}>Edit</Link>
                  </Button>
                  {b.status === 'draft' ? (
                    <Button size="sm" onClick={() => void handleActivate(b.id)}>
                      Activate
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
