import { Metadata } from 'next';

import { PricingSetupContainer } from '@/components/containers/creator/PricingSetupContainer';

export const metadata: Metadata = {
  title: 'Set Pricing | NuttyFans',
  description: 'Set your subscription pricing on NuttyFans.',
};

export default function PricingPage() {
  return <PricingSetupContainer />;
}
