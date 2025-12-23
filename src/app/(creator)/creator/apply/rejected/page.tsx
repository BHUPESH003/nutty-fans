import { Metadata } from 'next';

import { RejectedContainer } from '@/components/containers/creator/RejectedContainer';

export const metadata: Metadata = {
  title: 'Application Not Approved | NuttyFans',
  description: 'Your creator application was not approved.',
};

export default function RejectedPage() {
  return <RejectedContainer />;
}
