import { Metadata } from 'next';

import { CreatorKycContainer } from '@/components/containers/creator/CreatorKycContainer';

export const metadata: Metadata = {
  title: 'Identity Verification | NuttyFans',
  description: 'Verify your identity to start earning.',
};

export default function CreatorVerifyPage() {
  return <CreatorKycContainer />;
}
