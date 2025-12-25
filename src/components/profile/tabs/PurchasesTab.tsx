'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

interface PpvPurchaseItem {
  id: string;
  postId: string;
  pricePaid: number;
  createdAt: string;
  post: { id: string; content: string | null; thumbnailUrl: string | null } | null;
}

interface BundlePurchaseItem {
  id: string;
  bundleId: string;
  pricePaid: number;
  createdAt: string;
  bundle: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    creator: {
      user: { username: string | null; displayName: string | null; avatarUrl: string | null };
    };
  };
}

export function PurchasesTab() {
  const [items, setItems] = useState<PpvPurchaseItem[]>([]);
  const [bundleItems, setBundleItems] = useState<BundlePurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [ppvRes, bundleRes] = await Promise.all([
          apiClient.ppv.listPurchases(),
          apiClient.bundles.listPurchases(),
        ]);
        setItems((ppvRes.purchases || []) as PpvPurchaseItem[]);
        setBundleItems((bundleRes.purchases || []) as BundlePurchaseItem[]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Purchases</h2>
        <p className="text-sm text-muted-foreground">Your PPV unlocks and bundle purchases.</p>
      </div>

      {items.length === 0 && bundleItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No purchases yet</CardTitle>
            <CardDescription>Unlock PPV posts to see them appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={'/feed' as Route}>Browse feed</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bundleItems.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold">Bundles</div>
              <div className="grid gap-3">
                {bundleItems.map((p) => {
                  const creatorHandle = p.bundle?.creator?.user?.username;
                  const href = (creatorHandle ? `/c/${creatorHandle}` : '/explore') as Route;
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <CardContent className="flex gap-3 p-4">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {p.bundle?.coverImageUrl ? (
                            <Image
                              src={p.bundle.coverImageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={href} className="block">
                            <div className="line-clamp-2 text-sm font-medium">
                              {p.bundle?.title ?? 'Bundle'}
                            </div>
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>${p.pricePaid.toFixed(2)}</span>
                            <span>{new Date(p.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button asChild variant="outline" size="sm">
                            <Link href={href}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold">PPV</div>
              <div className="grid gap-3">
                {items.map((p) => {
                  const href = (p.postId ? `/post/${p.postId}` : '/feed') as Route;
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <CardContent className="flex gap-3 p-4">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {p.post?.thumbnailUrl ? (
                            <Image src={p.post.thumbnailUrl} alt="" fill className="object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={href} className="block">
                            <div className="line-clamp-2 text-sm font-medium">
                              {p.post?.content?.trim() ? p.post.content : 'PPV Post'}
                            </div>
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>${p.pricePaid.toFixed(2)}</span>
                            <span>{new Date(p.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Button asChild variant="outline" size="sm">
                            <Link href={href}>View</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
