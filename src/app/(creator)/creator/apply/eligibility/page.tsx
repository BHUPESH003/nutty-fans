import { Metadata } from 'next';

import { EligibilityContainer } from '@/components/containers/creator/EligibilityContainer';

export const metadata: Metadata = {
  title: 'Eligibility Check | NuttyFans',
  description: 'Verify your eligibility to become a creator on NuttyFans.',
};

export default function EligibilityPage() {
  return <EligibilityContainer />;
}
