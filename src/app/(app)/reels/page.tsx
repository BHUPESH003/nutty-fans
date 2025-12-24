import { Metadata } from 'next';

import { ReelsView } from '@/components/reels/ReelsView';

export const metadata: Metadata = {
  title: 'Reels - NuttyFans',
  description: 'Discover short-form video content from your favorite creators',
};

export default function ReelsPage() {
  return <ReelsView />;
}
