import { Metadata } from 'next';

import { CreatorApplicationContainer } from '@/components/containers/creator/CreatorApplicationContainer';

export const metadata: Metadata = {
  title: 'Become a Creator | NuttyFans',
  description: 'Apply to become a creator on NuttyFans and start earning from your content.',
};

export default function CreatorApplyPage() {
  return <CreatorApplicationContainer />;
}
