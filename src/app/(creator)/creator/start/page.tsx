import { Metadata } from 'next';

import { CreatorStartContainer } from '@/components/containers/creator/CreatorStartContainer';

export const metadata: Metadata = {
  title: 'Become a Creator | NuttyFans',
  description: 'Start your creator journey on NuttyFans and monetize your content.',
};

export default function CreatorStartPage() {
  return <CreatorStartContainer />;
}
