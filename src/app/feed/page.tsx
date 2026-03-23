import { Metadata } from 'next';
import Link from 'next/link';

import { FeedContainer } from '@/components/containers/feed/FeedContainer';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Feed | NuttyFans',
  description: 'See what your favorite creators are up to.',
};

export default function FeedPage() {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold">Home</h1>
        <Link href="/post/create">
          <Button size="sm" className="gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Post
          </Button>
        </Link>
      </div>
      <FeedContainer />
    </div>
  );
}
