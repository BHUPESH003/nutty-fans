import { Suspense } from 'react';

import { ExplorePageContainer } from '@/components/containers/explore/ExplorePageContainer';

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
      <ExplorePageContainer />
    </Suspense>
  );
}
