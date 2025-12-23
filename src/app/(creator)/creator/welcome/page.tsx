import { Metadata } from 'next';

import { WelcomeContainer } from '@/components/containers/creator/WelcomeContainer';

export const metadata: Metadata = {
  title: 'Welcome Creator | NuttyFans',
  description: 'Congratulations on becoming a creator!',
};

export default function WelcomePage() {
  return <WelcomeContainer />;
}
