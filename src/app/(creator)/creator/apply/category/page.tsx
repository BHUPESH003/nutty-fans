import { Metadata } from 'next';

import { CategorySelectionContainer } from '@/components/containers/creator/CategorySelectionContainer';

export const metadata: Metadata = {
  title: 'Choose Category | NuttyFans',
  description: 'Select your content category to become a creator.',
};

export default function CategoryPage() {
  return <CategorySelectionContainer />;
}
