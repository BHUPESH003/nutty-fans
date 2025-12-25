'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

interface BundleEditorContainerProps {
  bundleId?: string;
}

interface CreatorPostOption {
  id: string;
  content: string | null;
  media: { thumbnailUrl: string | null }[];
  createdAt: string;
}

export function BundleEditorContainer({ bundleId }: BundleEditorContainerProps) {
  const router = useRouter();
  const isEdit = !!bundleId;

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('9.99');
  const [originalPrice, setOriginalPrice] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<CreatorPostOption[]>([]);

  const selectedSet = useMemo(() => new Set(selectedPostIds), [selectedPostIds]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const postsRes = await apiClient.content.listMyPosts({ status: 'published', limit: 100 });
        setPosts((postsRes.posts || []) as CreatorPostOption[]);

        if (bundleId) {
          const b = await apiClient.bundles.getMy(bundleId);
          setTitle(b.title ?? '');
          setDescription(b.description ?? '');
          setPrice(String(Number(b.price ?? 0) || 0));
          setOriginalPrice(
            b.originalPrice !== null && b.originalPrice !== undefined
              ? String(Number(b.originalPrice))
              : ''
          );
          setCoverImageUrl(b.coverImageUrl ?? '');
          const itemPostIds = Array.isArray(b.items)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              b.items.map((it: any) => it.postId ?? it.post?.id).filter(Boolean)
            : [];
          setSelectedPostIds(itemPostIds);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [bundleId]);

  const togglePost = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleSave = async () => {
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      originalPrice: originalPrice.trim() ? Number(originalPrice) : null,
      coverImageUrl: coverImageUrl.trim() ? coverImageUrl.trim() : null,
    };

    if (!payload.title) throw new Error('Title is required');
    if (!Number.isFinite(payload.price) || payload.price <= 0)
      throw new Error('Price must be greater than 0');

    if (isEdit && bundleId) {
      await apiClient.bundles.update(bundleId, payload);
      await apiClient.bundles.setItems(bundleId, selectedPostIds);
      router.push('/creator/bundles' as Route);
      return;
    }

    const created = await apiClient.bundles.create({ ...payload, postIds: selectedPostIds });
    const createdId = created.id as string | undefined;
    if (createdId) {
      router.push(`/creator/bundles/${createdId}/edit` as Route);
    } else {
      router.push('/creator/bundles' as Route);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit bundle' : 'New bundle'}
        subtitle="Bundles are wallet purchases."
      />

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bundle details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original price (optional)</Label>
                  <Input
                    id="originalPrice"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover image URL (optional)</Label>
                <Input
                  id="coverImageUrl"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => void handleSave()}>
                  {isEdit ? 'Save' : 'Create bundle'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/creator/bundles' as Route)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bundle items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Select published posts to include. Selected: {selectedPostIds.length}
              </div>
              <div className="max-h-[520px] space-y-2 overflow-auto pr-2">
                {posts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePost(p.id)}
                    className="flex w-full items-start gap-3 rounded-lg border border-white/10 p-3 text-left hover:bg-white/5"
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border ${
                        selectedSet.has(p.id) ? 'border-primary bg-primary' : 'border-white/20'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-medium">
                        {p.content?.trim() ? p.content : `Post ${p.id.slice(0, 8)}`}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {posts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No published posts found. Publish some posts first.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
