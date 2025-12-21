'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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

function ExploreContent() {
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
        // Search Results View
        <SearchResultsView query={query} />
      ) : (
        // Explore View (Trending, Categories, Feed)
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

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
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

function SearchResultsView({ query }: { query: string }) {
  const [results, setResults] = useState<{ creators: Creator[]; posts: Post[] }>({
    creators: [],
    posts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      try {
        setLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchResults = (await apiClient.search.search(query)) as any;
        setResults({
          creators: searchResults.creators || [],
          posts: searchResults.posts || [],
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    void performSearch();
  }, [query]);

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Searching...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Search Results</h1>
        <p className="text-muted-foreground">Results for &quot;{query}&quot;</p>
      </div>

      <Tabs defaultValue="creators" className="w-full">
        <TabsList>
          <TabsTrigger value="creators">Creators ({results.creators.length})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-4">
          {results.creators.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No creators found</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {results.posts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No posts found</p>
          ) : (
            <div className="space-y-4">
              {results.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <a
      href={`/c/${creator.handle}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatarUrl}
              alt={creator.displayName}
              className="h-12 w-12 object-cover"
            />
          ) : (
            <span className="text-lg">{creator.displayName[0]}</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <p className="truncate font-medium">{creator.displayName}</p>
            {creator.isVerified && <span className="text-primary">✓</span>}
          </div>
          <p className="truncate text-sm text-muted-foreground">@{creator.handle}</p>
          {creator.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{creator.bio}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {creator.subscriberCount.toLocaleString()} subscribers
          </p>
        </div>
      </div>
    </a>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <a
      href={`/post/${post.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {post.creatorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.creatorAvatarUrl}
              alt={post.creatorDisplayName}
              className="h-8 w-8 object-cover"
            />
          ) : (
            <span className="text-sm">{post.creatorDisplayName[0]}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{post.creatorDisplayName}</p>
          <p className="text-xs text-muted-foreground">@{post.creatorHandle}</p>
        </div>
      </div>
      {post.content && <p className="mb-2 line-clamp-3 text-sm">{post.content}</p>}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>❤️ {post.likeCount}</span>
        <span>💬 {post.commentCount}</span>
        {post.mediaCount > 0 && <span>📷 {post.mediaCount}</span>}
      </div>
    </a>
  );
}
