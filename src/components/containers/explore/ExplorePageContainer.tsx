'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CategoryGrid } from '@/components/explore/CategoryGrid';
import { ExploreFeed } from '@/components/explore/ExploreFeed';
import { TrendingCreators } from '@/components/explore/TrendingCreators';
import { SearchBar } from '@/components/search/SearchBar';
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

  // Find category by slug
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  return (
    <div className="container mx-auto max-w-7xl py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {query ? (
        <SearchResultsView query={query} />
      ) : (
        <div className="space-y-8">
          <Tabs defaultValue="trending" className="w-full">
            <TabsList>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="feed">Explore Feed</TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="space-y-8">
              {!loadingCategories && (
                <CategoryGrid categories={categories} selectedCategory={selectedCategory?.id} />
              )}
              <TrendingCreators />
            </TabsContent>

            <TabsContent value="feed">
              <div className="space-y-4">
                {!loadingCategories && (
                  <CategoryGrid categories={categories} selectedCategory={selectedCategory?.id} />
                )}
                <ExploreFeed />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
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
    <div className="space-y-10">
      {/* Creators */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Creators</h2>
        {results.creators.length === 0 ? (
          <div className="rounded-lg border bg-muted/10 py-8 text-center text-muted-foreground">
            No creators found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.creators.map((creator) => (
              <a
                key={creator.id}
                href={`/c/${creator.handle}`}
                className="rounded-lg border bg-card p-4 hover:bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
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

      {/* Posts */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Posts</h2>
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
                className="rounded-lg border bg-card p-4 hover:bg-muted/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
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
