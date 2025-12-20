import { Metadata } from 'next';

import { CreatorDashboardContainer } from '@/components/containers/creator/CreatorDashboardContainer';

export const metadata: Metadata = {
  title: 'Creator Dashboard | NuttyFans',
  description: 'Manage your content and earnings.',
};

export default function CreatorDashboardPage() {
  return <CreatorDashboardContainer />;
}
