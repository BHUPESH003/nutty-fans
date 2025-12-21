import { UserProfilePageContainer } from '@/components/containers/profile/UserProfilePageContainer';

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { handle } = await params;
  return <UserProfilePageContainer handle={handle} />;
}
