'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CategoryGrid } from '@/components/explore/CategoryGrid';
import { ExploreFeed } from '@/components/explore/ExploreFeed';
import { ExploreRailContent } from '@/components/explore/ExploreRailExtras';
import { TrendingCreators } from '@/components/explore/TrendingCreators';
import { AppRailLayout } from '@/components/layout/AppRailLayout';
import { SearchBar } from '@/components/search/SearchBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/services/apiClient';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface Creator {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  bio: string | null;
  subscriberCount: number;
}

interface Post {
  id: string;
  creatorAvatarUrl: string | null;
  creatorDisplayName: string;
  creatorHandle: string;
  content: string | null;
  likeCount: number;
  commentCount: number;
  mediaCount: number;
}

export function ExplorePageContainer() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await apiClient.common.getCategories();
        setCategories(result);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  return (
    <AppRailLayout rail={<ExploreRailContent />}>
      {query ? (
        <div className="space-y-6">
          <header className="glass sticky top-14 z-20 border-b border-neutral-200/80 px-5 py-5 md:top-0">
            <div className="mx-auto flex max-w-[720px] items-center gap-3">
              <SearchBar
                variant="discover"
                placeholder="Search creators, tags, or keywords..."
                defaultValue={query}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-12 w-12 shrink-0 rounded-full border-surface-container-high bg-surface-container-high hover:bg-surface-container-highest"
                asChild
              >
                <Link href="/explore" aria-label="Discover grid">
                  <span className="material-symbols-outlined text-[22px] text-on-surface">
                    grid_view
                  </span>
                </Link>
              </Button>
            </div>
          </header>
          <div className="px-5 pb-10">
            <SearchResultsView query={query} />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="trending" className="w-full">
          <header className="glass sticky top-14 z-20 border-b border-neutral-200/80 px-5 py-5 md:top-0">
            <div className="mx-auto flex max-w-[720px] flex-col gap-6">
              <div className="flex items-center gap-3">
                <SearchBar
                  variant="discover"
                  placeholder="Search creators, tags, or keywords..."
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-12 w-12 shrink-0 rounded-full border-surface-container-high bg-surface-container-high hover:bg-surface-container-highest"
                  asChild
                >
                  <Link href="/explore" aria-label="Discover grid">
                    <span className="material-symbols-outlined text-[22px] text-on-surface">
                      grid_view
                    </span>
                  </Link>
                </Button>
              </div>

              <TabsList className="flex h-auto w-full justify-start gap-8 rounded-none border-0 bg-transparent p-0">
                <TabsTrigger
                  value="trending"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-sm font-semibold text-on-surface-variant shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Trending
                </TabsTrigger>
                <TabsTrigger
                  value="feed"
                  className="rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-sm font-semibold text-on-surface-variant shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Explore feed
                </TabsTrigger>
              </TabsList>

              {loadingCategories ? (
                <div className="h-9 w-full max-w-md animate-pulse rounded-full bg-surface-container-low" />
              ) : (
                <CategoryGrid
                  categories={categories}
                  selectedCategory={selectedCategory?.id}
                  variant="chips"
                />
              )}
            </div>
          </header>

          <div className="px-5 py-8">
            <TabsContent value="trending" className="mt-0 space-y-8 focus-visible:outline-none">
              <TrendingCreators />
            </TabsContent>

            <TabsContent value="feed" className="mt-0 focus-visible:outline-none">
              <ExploreFeed />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </AppRailLayout>
  );
}

function SearchResultsView({ query }: { query: string }) {
  const [results, setResults] = useState<{ creators: Creator[]; posts: Post[] }>({
    creators: [],
    posts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const result = await apiClient.search.search(query);
        setResults(result);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };
    void search();
  }, [query]);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Searching...</div>;
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-10">
      <div>
        <h2 className="mb-4 font-headline text-xl font-bold">Creators</h2>
        {results.creators.length === 0 ? (
          <div className="rounded-lg border bg-muted/10 py-8 text-center text-muted-foreground">
            No creators found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.creators.map((creator) => (
              <a
                key={creator.id}
                href={`/c/${creator.handle}`}
                className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {creator.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {creator.displayName}{' '}
                      {creator.isVerified ? <span className="text-primary">✓</span> : null}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">@{creator.handle}</div>
                  </div>
                </div>
                {creator.bio ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{creator.bio}</p>
                ) : null}
                <div className="mt-3 text-xs text-muted-foreground">
                  {creator.subscriberCount} subscribers
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-headline text-xl font-bold">Posts</h2>
        {results.posts.length === 0 ? (
          <div className="rounded-lg border bg-muted/10 py-8 text-center text-muted-foreground">
            No posts found.
          </div>
        ) : (
          <div className="grid gap-4">
            {results.posts.map((post) => (
              <a
                key={post.id}
                href={`/posts/${post.id}`}
                className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {post.creatorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.creatorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{post.creatorDisplayName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      @{post.creatorHandle}
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm">{post.content || '—'}</p>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>{post.likeCount} likes</span>
                  <span>{post.commentCount} comments</span>
                  <span>{post.mediaCount} media</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
