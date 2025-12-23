import { Metadata } from 'next';

import { ProfileSetupContainer } from '@/components/containers/creator/ProfileSetupContainer';

export const metadata: Metadata = {
  title: 'Profile Setup | NuttyFans',
  description: 'Set up your creator profile on NuttyFans.',
};

export default function ProfileSetupPage() {
  return <ProfileSetupContainer />;
}
