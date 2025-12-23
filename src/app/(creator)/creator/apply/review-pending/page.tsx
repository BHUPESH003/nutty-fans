import { Metadata } from 'next';

import { ReviewPendingContainer } from '@/components/containers/creator/ReviewPendingContainer';

export const metadata: Metadata = {
  title: 'Application Under Review | NuttyFans',
  description: 'Your creator application is being reviewed.',
};

export default function ReviewPendingPage() {
  return <ReviewPendingContainer />;
}
